create table anybike_publishing.page_content_bindings (
 page_path text not null,
 kind text not null check(kind in ('history','guide','market_story','label')),
 copy jsonb,
 source_url text,
 model_id bigint references public.motorcycle_catalog_models(id),
 navigation_key text references anybike_publishing.navigation_items(key),
 primary key(page_path,kind)
);
alter table anybike_publishing.page_content_bindings enable row level security;
create table anybike_publishing.market_global_features (
 page_path text primary key, story_id bigint not null references public.motorcycle_global_stories_v1(id)
);
alter table anybike_publishing.market_global_features enable row level security;
revoke all on anybike_publishing.page_content_bindings,anybike_publishing.market_global_features from public,anon,authenticated;
insert into anybike_publishing.page_content_bindings(page_path,kind,copy,source_url) values
('/bmw-motorcycles.html','history',jsonb_build_object('en','Max Friz designed the R 32, the first motorcycle sold under the BMW name. BMW unveiled it at the 1923 Berlin Motor Show. Its flat-twin engine had a cylinder on each side of the frame, and a shaft drove the rear wheel.','fr','Max Friz a conçu la R 32, la première moto commercialisée sous le nom BMW. Présentée au Salon de Berlin en 1923, elle avait un moteur bicylindre à plat avec un cylindre de chaque côté du cadre et une transmission à la roue arrière par arbre.'),'https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-569-1.bmw-r-32.html');
insert into anybike_publishing.page_content_bindings(page_path,kind,model_id)
select '/harley-davidson-motorcycles.html','guide',id from public.motorcycle_catalog_models where id=139 and manufacturer='Harley-Davidson' and model='Night Rod Special';
insert into anybike_publishing.page_content_bindings(page_path,kind,navigation_key) values('/markets/reunion.html','label','pub-types');
insert into anybike_publishing.page_content_bindings(page_path,kind) values('/markets/sweden.html','market_story');
create function public.public_catalogue_page_content_v1(p_path text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
 'kind',b.kind,'labels',coalesce(b.copy,n.labels),'source',b.source_url,
 'model_id',m.id,'model',m.model,'path',coalesce(n.path,s.story_url),'headline',s.headline
 )) order by b.kind),'[]'::jsonb)
 from anybike_publishing.page_content_bindings b
 left join public.motorcycle_catalog_models m on m.id=b.model_id
 left join anybike_publishing.navigation_items n on n.key=b.navigation_key and n.section='public'
 left join anybike_publishing.market_global_features f on f.page_path=b.page_path and b.kind='market_story'
 left join public.motorcycle_global_stories_v1 s on s.id=f.story_id and s.editorial_status='published'
 where b.page_path=p_path and (b.kind<>'market_story' or s.id is not null)
$$;
revoke all on function public.public_catalogue_page_content_v1(text) from public;
grant execute on function public.public_catalogue_page_content_v1(text) to anon,authenticated;
