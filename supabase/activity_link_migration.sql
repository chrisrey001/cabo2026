alter table activities add column if not exists link text not null default '';

update activities set link = 'https://www.sevenrooms.com/reservations/florafarms'
  where title = 'Flora Farms Dinner' and link = '';

update activities set link = 'https://www.viator.com/Los-Cabos-attractions/Arch-of-Cabo-San-Lucas/d627-a979'
  where title = 'Cabo Arch Boat Tour' and link = '';

update activities set link = 'https://www.artcabo.com/san-jose-del-cabo-art-walk.html'
  where title = 'San José Art Walk' and link = '';

update activities set link = 'https://picantesportfishing.com/'
  where title = 'Deep-Sea Fishing Charter' and link = '';

update activities set link = 'https://www.cabo-adventures.com/en/tour/camel-atv-ecofarm'
  where title = 'ATV + Camel + Tequila' and link = '';
