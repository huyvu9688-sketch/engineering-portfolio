-- Inside-PDF text search ----------------------------------------------------
-- Store the body text extracted from PDFs at upload time and fold it into the
-- existing full-text `search` vector so the search box matches words *inside*
-- documents, not just the title/description/tags. CAD binaries are unaffected;
-- only PDFs carry content_text.

alter table public.documents
  add column if not exists content_text text;

-- Rebuild the search trigger with weighted ranking so a title hit always ranks
-- above a body hit:
--   A = title              (strongest)
--   B = description + tags
--   C = extracted PDF body  (weakest)
create or replace function public.update_documents_search()
returns trigger
language plpgsql
as $$
begin
  new.search :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english',
      coalesce(new.description, '') || ' ' ||
      array_to_string(new.tags, ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content_text, '')), 'C');
  return new;
end;
$$;

-- Re-run the trigger over existing rows so they pick up the new weighted vector
-- (a no-op write fires the BEFORE UPDATE trigger). Existing PDFs have no
-- extracted text yet — re-upload to index their contents.
update public.documents set content_text = content_text;
