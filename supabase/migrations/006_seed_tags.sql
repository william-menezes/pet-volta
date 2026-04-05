insert into public.tags (tag_code, status)
select 'PV' || lpad(gs::text, 6, '0'), 'orphan'
from generate_series(1, 20) as gs
on conflict (tag_code) do nothing;

