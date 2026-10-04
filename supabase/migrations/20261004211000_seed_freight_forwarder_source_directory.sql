-- Seed the reusable freight-forwarder directory from the existing AnyBike source page.
with source(company_name,website,services,countries,notes) as (
  values
    ('Rapid Shipping','https://www.rapid-shipping.co.uk/international-shipping-services/motorcycle',
      '["Sea Freight","Air Freight","Multimodal","Motorcycle Collection","Packing","Customs Clearance"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. UK-based international shipper.'),
    ('Oakbridge Logistics','https://www.oakbridgelogistics.co.uk/sec/237/Motorcycle-Shipping/',
      '["Road Transport","Air Freight","Sea Freight","Motorcycle Packing"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Specialist motorcycle logistics provider.'),
    ('Move Motorcycles','https://www.movemotorcycles.co.uk/',
      '["UK Motorcycle Collection","Road Transport","Freight Handover"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. UK collection and freight handover.'),
    ('Kingstown Shipping','https://www.kingstown-shipping.co.uk/motorcycle-shipping.html',
      '["Shared Container","Road Delivery","Motorcycle Freight"]'::jsonb,'["United States"]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page.'),
    ('Anglo Pacific','https://www.anglopacific.co.uk/motorbike_shipping.htm',
      '["Container","RoRo","Road Collection","Door to Door"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Selected worldwide routes; exact country coverage should be confirmed with provider.'),
    ('Schumacher Cargo Logistics','https://www.schumachercargo.com/motorcycle-shipping/',
      '["Sea Freight","Container","Air Freight","Pickup","Motorcycle Freight"]'::jsonb,'["United States"]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page.'),
    ('J&A Marshall','https://www.jandamarshall.co.uk/',
      '["Container Loading","Container Unloading","Storage","Vehicle Handling"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Southampton container preparation specialist.'),
    ('LV Logistics Southampton','https://lv-logistics.com/southampton',
      '["Freight Forwarding","Vehicle Logistics"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Southampton freight enquiries.'),
    ('YFT Logistics','https://www.yftlogistics.co.uk/',
      '["RoRo","Container","Freight Forwarding"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Southampton / UK port vehicle enquiries.'),
    ('MotoFreight','https://www.motofreight.com/',
      '["Motorcycle Freight","International Shipping"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Dedicated motorcycle freight specialist.'),
    ('James Cargo Services','https://www.jamescargo.com/motorcycles/',
      '["Sea Freight","Air Freight","Road Transport","Motorcycle Freight"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page.'),
    ('West Coast Shipping','https://www.wcshipping.com/',
      '["Sea Freight","Air Freight","Door to Door","Vehicle Shipping"]'::jsonb,'["United States"]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page.'),
    ('IVSS UK','https://ivssuk.com/motorcycle-shipping/',
      '["RoRo","Full Container","Shared Container","Motorcycle Freight"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page.'),
    ('Autoshippers','https://www.autoshippers.co.uk/motorbike-shipping.htm',
      '["Container","RoRo","UK Collection","Motorcycle Freight"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Worldwide enquiries; exact country coverage should be confirmed with provider.'),
    ('Ascope Shipping','https://www.ascopeshipping.co.uk/motorcycle-shipping/',
      '["Container","RoRo","Export Support","Motorcycle Freight"]'::jsonb,'[]'::jsonb,
      'Imported from existing AnyBike Freight Forwarders source page. Africa, Caribbean and Middle East enquiries; exact countries should be confirmed with provider.')
)
insert into public.freight_forwarders(
  company_name,scope,country,website,countries_covered,ports_served,services,
  verification_status,partner_status,is_active,source_customer,internal_notes,created_at,updated_at
)
select
  s.company_name,'UK','United Kingdom',s.website,s.countries,'[]'::jsonb,s.services,
  'Unverified','Standard',true,'AnyBike Freight Forwarders source page',s.notes,now(),now()
from source s
where not exists (
  select 1 from public.freight_forwarders f
  where lower(trim(f.company_name))=lower(trim(s.company_name))
);
