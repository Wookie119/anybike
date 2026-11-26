CREATE OR REPLACE FUNCTION public.dealerwebs_stage_snapshot_v1(p_batch text, p_vehicles jsonb, p_dealers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare sid bigint;n integer;v_conn record;v_run bigint;original_batch text;current_batch text;
begin
if p_batch !~ '^dealerwebs-[a-f0-9]{64}-[a-f0-9]{64}$' or jsonb_typeof(p_vehicles)<>'array' or jsonb_typeof(p_dealers)<>'array' then raise exception 'Invalid snapshot'; end if;
if jsonb_array_length(p_vehicles) not between 1 and 20000 or jsonb_array_length(p_dealers) not between 1 and 5000 then raise exception 'Invalid snapshot size'; end if;
select id,current_import_batch_id into strict sid,current_batch
from public.stock_sources where external_source_id='dealerwebs-dms14' and not is_active for update;
original_batch:=p_batch;
if current_batch is distinct from p_batch and exists (
 select 1 from public.stock_import_staging where source_id=sid and batch_id=p_batch
) then
 -- An earlier CSV can legitimately return after a changed snapshot.
 if exists (select 1 from public.stock_import_batches where source_id=sid
  and batch_id=current_batch and notes='DealerWebs replay of '||original_batch)
 then
  p_batch:=current_batch;
 else
  p_batch:='dealerwebs-'||encode(sha256(convert_to(original_batch,'UTF8')),'hex')
   ||'-'||encode(sha256(convert_to(coalesce(current_batch,'')||':'||original_batch,'UTF8')),'hex');
 end if;
end if;
select count(*) into n from public.stock_import_staging where source_id=sid and batch_id=p_batch;
if n>0 then if n<>jsonb_array_length(p_vehicles) then raise exception 'Incomplete prior snapshot'; end if;perform public.dealerwebs_reuse_stock_mappings_v1(p_batch);return jsonb_build_object('staged',n,'already_staged',true);end if;
if exists(select 1 from jsonb_array_elements(p_vehicles) v where nullif(btrim(v->>'Feed_Id'),'') is null or nullif(btrim(v->>'Vehicle_ID'),'') is null or nullif(btrim(v->>'Make'),'') is null or nullif(btrim(v->>'Model'),'') is null or not exists(select 1 from jsonb_array_elements(p_dealers) d where btrim(d->>'location_code')=btrim(v->>'Feed_Id'))) then raise exception 'Invalid vehicle mapping';end if;
if (select count(distinct (btrim(v->>'Feed_Id'),btrim(v->>'Vehicle_ID'))) from jsonb_array_elements(p_vehicles) v)<>jsonb_array_length(p_vehicles) then raise exception 'Duplicate vehicle';end if;
if (select count(distinct nullif(btrim(d->>'location_code'),'')) from jsonb_array_elements(p_dealers) d)<>jsonb_array_length(p_dealers) then raise exception 'Invalid dealer codes';end if;
insert into public.stock_import_staging(source_id,batch_id,row_number,raw_data,validation_status)
select sid,p_batch,v.ord::integer,jsonb_build_object('vehicle',v.item,'dealer',d.item,'vat_qualifying',null,'public_visible',false,'export_visible',false),'pending'
from jsonb_array_elements(p_vehicles) with ordinality v(item,ord) join jsonb_array_elements(p_dealers) d(item) on btrim(d.item->>'location_code')=btrim(v.item->>'Feed_Id');
get diagnostics n=row_count;
if n<>jsonb_array_length(p_vehicles) then raise exception 'Incomplete snapshot';end if;
perform public.dealerwebs_reuse_stock_mappings_v1(p_batch);
insert into public.stock_import_batches(source_id,batch_id,completed_at,status,total_rows,imported_rows,failed_rows,notes) values(sid,p_batch,now(),'completed',n,0,0,case when original_batch<>p_batch then 'DealerWebs replay of '||original_batch else 'Validated private staging snapshot; not published' end) on conflict(batch_id) do nothing;
update public.stock_sources set current_import_batch_id=p_batch,updated_at=now() where id=sid and not is_active;
update public.source_feed_records r
set raw_payload=(s.raw_data->'vehicle')::text,
payload_hash=md5((s.raw_data->'vehicle')::text),
parsed_payload=jsonb_strip_nulls(jsonb_build_object('make',nullif(trim(s.raw_data->'vehicle'->>'Make'),''),'model',nullif(trim(s.raw_data->'vehicle'->>'Model'),''),'colour',nullif(trim(s.raw_data->'vehicle'->>'Colour'),''),'registration',nullif(trim(s.raw_data->'vehicle'->>'Registration'),''),'asking_price',nullif(trim(s.raw_data->'vehicle'->>'Price'),''),'mileage',nullif(trim(s.raw_data->'vehicle'->>'Mileage'),''),'catalogue_model_id',s.raw_data->'catalogue_model_id')),
last_seen_at=now(),updated_at=now()
from public.stock_import_staging s join public.stock_source_connections c
on c.external_account_id=btrim(s.raw_data->'vehicle'->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id'
where s.source_id=sid and s.batch_id=p_batch and c.configuration->>'source'='dealerwebs-dms14' and c.import_paused and not c.integration_enabled and not c.public_enabled
and r.connection_id=c.id and r.external_record_id=btrim(s.raw_data->'vehicle'->>'Vehicle_ID') and not r.source_active
and r.raw_payload::jsonb is distinct from s.raw_data->'vehicle';
insert into public.source_feed_records(connection_id,external_record_id,raw_payload,payload_hash,parsed_payload,source_active,first_seen_at,last_seen_at)
select c.id,btrim(s.raw_data->'vehicle'->>'Vehicle_ID'),(s.raw_data->'vehicle')::text,md5((s.raw_data->'vehicle')::text),
jsonb_strip_nulls(jsonb_build_object('make',nullif(trim(s.raw_data->'vehicle'->>'Make'),''),'model',nullif(trim(s.raw_data->'vehicle'->>'Model'),''),'colour',nullif(trim(s.raw_data->'vehicle'->>'Colour'),''),'registration',nullif(trim(s.raw_data->'vehicle'->>'Registration'),''),'asking_price',nullif(trim(s.raw_data->'vehicle'->>'Price'),''),'mileage',nullif(trim(s.raw_data->'vehicle'->>'Mileage'),''),'catalogue_model_id',s.raw_data->'catalogue_model_id')),false,now(),now()
from public.stock_import_staging s join public.stock_source_connections c on c.external_account_id=btrim(s.raw_data->'vehicle'->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id'
where s.source_id=sid and s.batch_id=p_batch and c.configuration->>'source'='dealerwebs-dms14' and c.import_paused and not c.integration_enabled and not c.public_enabled
on conflict(connection_id,external_record_id) do nothing;
insert into public.junction_stock(connection_id,source_record_id,source_provider,source_stock_id,dealer_name,make,model,variant,year,mileage,engine_cc,price_gbp,colour,registration,status,source_active,test_visible,public_visible,export_visible,trade_visible,extra_fields,first_seen_at,last_seen_at)
select c.id,r.id,'dealerwebs',r.external_record_id,c.dealer_name,trim(v->>'Make'),trim(v->>'Model'),nullif(trim(v->>'Variant'),''),
nullif(substring(v->>'Year' from '^(19[0-9]{2}|20[0-9]{2})$'),'')::integer,
substring(v->>'Mileage' from '^[0-9]{1,8}$')::integer,
nullif(substring(v->>'EngineSize' from '^[0-9]{1,5}$')::integer,0),
nullif(substring(v->>'Price' from '^[0-9]{1,9}[.]?[0-9]{0,2}$')::numeric,0),
nullif(trim(v->>'Colour'),''),nullif(trim(v->>'Registration'),''),'Image preparation',false,false,false,false,false,jsonb_strip_nulls(jsonb_build_object('catalogue_model_id',s.raw_data->'catalogue_model_id','source_record_id',r.id,'import_state','private_staging')),r.first_seen_at,r.last_seen_at
from public.stock_import_staging s cross join lateral (select s.raw_data->'vehicle' v) x
join public.stock_source_connections c on c.external_account_id=btrim(v->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id'
join public.source_feed_records r on r.connection_id=c.id and r.external_record_id=btrim(v->>'Vehicle_ID')
where s.source_id=sid and s.batch_id=p_batch and c.configuration->>'source'='dealerwebs-dms14' and c.import_paused and not c.integration_enabled and not c.public_enabled and not c.publish_stock and not r.source_active
on conflict(connection_id,source_stock_id) do nothing;
update public.junction_stock j set price_gbp=coalesce(nullif(substring(v->>'Price' from '^[0-9]{1,9}(?:[.][0-9]{1,2})?$')::numeric,0),j.price_gbp),mileage=coalesce(substring(v->>'Mileage' from '^[0-9]{1,8}$')::integer,j.mileage),last_seen_at=now(),updated_at=now()
from public.stock_import_staging s cross join lateral (select s.raw_data->'vehicle' v) x
join public.stock_source_connections c on c.external_account_id=btrim(v->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id'
where s.source_id=sid and s.batch_id=p_batch and c.configuration->>'source'='dealerwebs-dms14' and c.import_paused and not c.integration_enabled and not c.public_enabled and not c.publish_stock and j.connection_id=c.id and j.source_stock_id=btrim(v->>'Vehicle_ID') and not j.source_active and not j.public_visible and not j.export_visible and not j.trade_visible;
for v_conn in
 select c.id, count(s.id)::integer as received
 from public.stock_source_connections c
 left join public.stock_import_staging s on s.source_id=sid and s.batch_id=p_batch and c.external_account_id=btrim(s.raw_data->'vehicle'->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id'
 where c.configuration->>'source'='dealerwebs-dms14' and c.import_paused and not c.integration_enabled and not c.public_enabled and not c.publish_stock
 group by c.id
loop
 insert into public.source_feed_runs(connection_id,started_at,completed_at,success,records_received,reconciliation_status,reconciliation_applied,raw_response)
 values(v_conn.id,now(),now(),true,v_conn.received,'not_evaluated',false,p_batch)
 returning id into v_run;
 if public.anybike_feed_reconciliation_allowed(v_conn.id,v_run,v_conn.received) and v_conn.received>0 then
   update public.source_feed_records r set ended_at=coalesce(r.ended_at,now()),updated_at=now()
   where r.connection_id=v_conn.id and not r.source_active and r.ended_at is null
   and not exists(select 1 from public.stock_import_staging s join public.stock_source_connections c on c.id=v_conn.id where s.source_id=sid and s.batch_id=p_batch and c.external_account_id=btrim(s.raw_data->'vehicle'->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id' and r.external_record_id=btrim(s.raw_data->'vehicle'->>'Vehicle_ID'));
   update public.junction_stock j set ended_at=coalesce(j.ended_at,now()),updated_at=now()
   from public.source_feed_records r where r.id=j.source_record_id and r.connection_id=v_conn.id and j.connection_id=v_conn.id and r.ended_at is not null and not j.source_active and not j.public_visible and not j.export_visible and not j.trade_visible and not j.test_visible and j.ended_at is null;
   update public.source_feed_records r set ended_at=null,last_seen_at=now(),updated_at=now()
   where r.connection_id=v_conn.id and not r.source_active and exists(select 1 from public.stock_import_staging s join public.stock_source_connections c on c.id=v_conn.id where s.source_id=sid and s.batch_id=p_batch and c.external_account_id=btrim(s.raw_data->'vehicle'->>'Feed_Id') and c.dealer_organisation_id::text=s.raw_data->>'dealer_organisation_id' and r.external_record_id=btrim(s.raw_data->'vehicle'->>'Vehicle_ID'));
   update public.junction_stock j set ended_at=null,updated_at=now()
   from public.source_feed_records r where r.id=j.source_record_id and r.connection_id=v_conn.id and j.connection_id=v_conn.id and r.ended_at is null and not j.source_active and not j.public_visible and not j.export_visible and not j.trade_visible and not j.test_visible and j.ended_at is not null;
   update public.live_source_items i set source_price_gbp=j.price_gbp,mileage=j.mileage,last_seen_at=j.last_seen_at,updated_at=now()
   from public.junction_stock j join public.live_source_connectors c on c.adapter_key='dealerwebs-dms14' and not c.enabled
   join public.anybike_international_vq_gallery g on not g.published
   where i.id=g.live_source_item_id and i.connector_id=c.id and i.source_key='junction:'||j.id::text and i.raw_data->>'junction_stock_id'=j.id::text and j.connection_id=v_conn.id and j.source_provider='dealerwebs' and i.excluded_from_sourcing and i.source_status='review' and j.ended_at is null
   and (i.source_price_gbp,i.mileage,i.last_seen_at) is distinct from (j.price_gbp,j.mileage,j.last_seen_at);
   update public.live_source_items i set source_status='ended',ended_at=j.ended_at,updated_at=now()
   from public.junction_stock j join public.live_source_connectors c on c.adapter_key='dealerwebs-dms14' and not c.enabled
   join public.anybike_international_vq_gallery g on not g.published
   where i.id=g.live_source_item_id and i.connector_id=c.id and i.source_key='junction:'||j.id::text and i.raw_data->>'junction_stock_id'=j.id::text and j.connection_id=v_conn.id and j.source_provider='dealerwebs' and i.excluded_from_sourcing and i.source_status='review' and j.ended_at is not null;
   update public.live_source_items i set source_status='review',ended_at=null,source_price_gbp=j.price_gbp,mileage=j.mileage,last_seen_at=j.last_seen_at,updated_at=now()
   from public.junction_stock j join public.live_source_connectors c on c.adapter_key='dealerwebs-dms14' and not c.enabled
   join public.anybike_international_vq_gallery g on not g.published
   where i.id=g.live_source_item_id and i.connector_id=c.id and i.source_key='junction:'||j.id::text and i.raw_data->>'junction_stock_id'=j.id::text and j.connection_id=v_conn.id and j.source_provider='dealerwebs' and i.excluded_from_sourcing and i.source_status='ended' and j.ended_at is null;
   update public.source_feed_runs set reconciliation_applied=true where id=v_run;
 end if;
end loop;
return jsonb_build_object('staged',n,'already_staged',false);
end $function$;
