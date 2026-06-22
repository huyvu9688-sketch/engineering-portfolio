-- Recategorize by literal file type instead of by document purpose ---------
-- The old categories (datasheet/standard/report) all accepted .pdf, so
-- auto-detection from a picked file had no way to know which one was meant
-- and always guessed the same one. New categories map 1:1 from extension:
--   cad_3d, drawing_2d (dwg/dxf), pdf (pdf/docx), image, ppt, excel (xlsx/csv)

-- Step 1: remap existing rows before the CHECK constraint changes under them.
update public.documents set category = 'pdf'
  where category in ('datasheet', 'standard');

update public.documents set category = 'excel'
  where category = 'report' and file_ext in ('xlsx', 'csv');

update public.documents set category = 'pdf'
  where category = 'report' and file_ext in ('pdf', 'docx');

update public.documents set category = 'pdf'
  where category = 'drawing_2d' and file_ext = 'pdf';

-- Step 2: swap the CHECK constraint to the new category set.
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in ('cad_3d', 'drawing_2d', 'pdf', 'image', 'ppt', 'excel'));
