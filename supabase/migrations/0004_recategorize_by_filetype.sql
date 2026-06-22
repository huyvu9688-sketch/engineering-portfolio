-- Recategorize by literal file type instead of by document purpose ---------
-- The old categories (datasheet/standard/report) all accepted .pdf, so
-- auto-detection from a picked file had no way to know which one was meant
-- and always landed on the same one. Replaced with categories keyed to
-- literal file type, derived from file_ext, where every extension belongs to
-- exactly one category — detection is now always exact, never a guess.

update public.documents set category = case file_ext
  when 'step'   then 'cad'
  when 'stp'    then 'cad'
  when 'iges'   then 'cad'
  when 'igs'    then 'cad'
  when 'dwg'    then 'cad'
  when 'dxf'    then 'cad'
  when 'sat'    then 'cad'
  when 'sldprt' then 'cad'
  when 'sldasm' then 'cad'
  when 'slddrw' then 'cad'
  when 'ipt'    then 'cad'
  when 'iam'    then 'cad'
  when 'prt'    then 'cad'
  when 'asm'    then 'cad'
  when 'x_t'    then 'cad'
  when 'glb'    then 'model_3d'
  when 'gltf'   then 'model_3d'
  when 'obj'    then 'model_3d'
  when 'fbx'    then 'model_3d'
  when 'stl'    then 'model_3d'
  when '3ds'    then 'model_3d'
  when 'pdf'    then 'pdf'
  when 'doc'    then 'word'
  when 'docx'   then 'word'
  when 'xls'    then 'excel'
  when 'xlsx'   then 'excel'
  when 'csv'    then 'csv'
  when 'ppt'    then 'ppt'
  when 'pptx'   then 'ppt'
  when 'png'    then 'image'
  when 'jpg'    then 'image'
  when 'jpeg'   then 'image'
  when 'gif'    then 'image'
  when 'webp'   then 'image'
  when 'svg'    then 'image'
  when 'bmp'    then 'image'
  when 'tiff'   then 'image'
  when 'tif'    then 'image'
  when 'txt'    then 'text'
  when 'zip'    then 'archive'
  when 'rar'    then 'archive'
  when '7z'     then 'archive'
  when 'tar'    then 'archive'
  when 'gz'     then 'archive'
  when 'mp4'    then 'video'
  when 'avi'    then 'video'
  when 'mov'    then 'video'
  when 'wmv'    then 'video'
  when 'mkv'    then 'video'
  when 'webm'   then 'video'
  else category
end;

alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in (
    'cad', 'model_3d', 'pdf', 'word', 'excel', 'csv',
    'ppt', 'image', 'text', 'archive', 'video'
  ));
