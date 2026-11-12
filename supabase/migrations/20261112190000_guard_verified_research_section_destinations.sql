-- AnyBike one approved research-section contract: every verified fact must
-- have an existing, renderable destination on the universal model page.
-- This contract mirrors public-verified-model-facts.mjs, with one category
-- per existing research subsection; does not alter the approved page design.
create table if not exists public.anybike_model_research_section_registry (
 category text primary key,
 display_label text not null,
 section_order integer not null unique,
 created_at timestamptz not null default now()
);
revoke all on public.anybike_model_research_section_registry from anon, authenticated;

insert into public.anybike_model_research_section_registry(category,display_label,section_order)
values
('model_year','Documented model years and specifications',1),
('market_launch','Market introductions',2),
('history','Motorcycle history',3),
('design','Design and development',4),
('engineering','Engineering and technical development',5),
('engine','Engine and powertrain',6),
('transmission','Transmission',7),
('performance','Performance',8),
('specification','Documented specifications',9),
('dimensions','Dimensions and weights',10),
('chassis','Chassis and suspension',11),
('wheels','Wheels and tyres',12),
('brakes','Braking system',13),
('factory_colours','Factory colours and finishes',14),
('manufacturing_evidence','Factory and manufacturing evidence',15),
('manufacturing','Manufacturing',16),
('production','Production records',17),
('competition','Competition history',18),
('motorsport','Documented racing and motorsport',19),
('touring','Touring equipment and specifications',20)
on conflict (category) do update
 set display_label=excluded.display_label,section_order=excluded.section_order;

-- Fail publication of unsupported research, instead of quietly storing
-- approved data that the public renderer would never show.
create or replace function public.anybike_require_model_research_display_section()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
 if new.verification_status='verified' and not exists(
  select 1 from public.anybike_model_research_section_registry r
  where r.category=new.category
 ) then
  raise exception 'Verified motorcycle research category "%" has no approved page section. Update section registry, renderer and public projection before publication.',new.category
  using errcode='23514';
 end if;
 return new;
end;
$function$;
drop trigger if exists anybike_verified_fact_requires_render_section on public.motorcycle_catalog_facts;
create trigger anybike_verified_fact_requires_render_section
before insert or update of category,verification_status on public.motorcycle_catalog_facts
for each row execute function public.anybike_require_model_research_display_section();

-- A read-only check for admin audit scripts: any result indicates a data
-- contract mismatch requiring development action before further publication.
create or replace view public.anybike_model_research_unrenderable_verified_v1
with (security_invoker=true) as
select f.id,f.catalog_model_id,f.category,f.label
from public.motorcycle_catalog_facts f
left join public.anybike_model_research_section_registry r on r.category=f.category
where f.verification_status='verified' and r.category is null;
revoke all on public.anybike_model_research_unrenderable_verified_v1 from anon,authenticated;
