-- Document and ownership guides are subsections inside the one approved
-- research panel, not extra page layouts or manufacturer-specific templates.
insert into public.anybike_model_research_section_registry(category,display_label,section_order)
values
('factory_documents','Factory documents and brochures',21),
('used_buying','Used buying and ownership guidance',22)
on conflict(category) do update
 set display_label=excluded.display_label,section_order=excluded.section_order;
