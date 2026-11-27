create table public.anybike_popular_model_guides_v1 (
  position smallint primary key check (position between 1 and 32),
  model_id bigint not null unique references public.motorcycle_catalog_models(id)
);
alter table public.anybike_popular_model_guides_v1 enable row level security;
revoke all on public.anybike_popular_model_guides_v1 from public, anon, authenticated;
grant select on public.anybike_popular_model_guides_v1 to anon, authenticated;
create policy read_published_guides on public.anybike_popular_model_guides_v1 for select to anon, authenticated using (true);
insert into public.anybike_popular_model_guides_v1(position,model_id)
select chosen.position, d.model_id from (values
  (1,'BMW','R 1300 GS'),
  (2,'Indian Motorcycle','Scout Bobber'),
  (3,'Harley-Davidson','Fat Boy'),
  (4,'Mugen','Shinden Go'),
  (5,'Honda','XL750 TRANSALP'),
  (6,'Bimota','Tesi H2'),
  (7,'CFMOTO','800NK'),
  (8,'Italjet','Formula 125'),
  (9,'KOVE','MX250'),
  (10,'Mutt Motorcycles','Mongrel 125'),
  (11,'Suzuki','V-Strom 800DE'),
  (12,'Aprilia','Tuono V4'),
  (13,'BMW','R 1250 GS'),
  (14,'BMW','S 1000 RR'),
  (15,'BMW','F 900 GS'),
  (16,'Harley-Davidson','Road Glide'),
  (17,'Harley-Davidson','Street Glide'),
  (18,'Harley-Davidson','Pan America 1250')
) as chosen(position,make,model)
join public.motorcycle_catalog_dropdown_clean d on d.make=chosen.make and d.model=chosen.model;
do $$ begin
  if (select count(*) from public.anybike_popular_model_guides_v1)<>18 then raise exception 'Incomplete directory guide selection'; end if;
end $$;
