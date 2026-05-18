# Operations Guide - Campus Resource Hub Final V1

## Daily workflow

Use this folder only:

```txt
campus-resource-hub-final-v1
```

Do not overwrite files from old folders.

## Run locally

```cmd
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Check database

```txt
http://localhost:3000/api/health/db
```

Expected:

```json
{"ok":true,"mode":"supabase","message":"Supabase database connected successfully."}
```

## Check storage

```txt
http://localhost:3000/api/health/storage
```

Expected:

```json
{"ok":true,"mode":"supabase-storage","bucket":"resource-files","message":"Supabase Storage bucket connected successfully."}
```

## Upload test

1. Open `/upload`
2. Upload a PDF/DOCX/PPTX/TXT
3. Open `/resources`
4. Click Download
5. Check Supabase Storage → resource-files → resources

## Security test

Try uploading:

```txt
test.jpg
test.png
test.mp4
test.zip
test.exe
```

Expected: rejected.

Try uploading a PDF whose filename/title contains unsafe words such as adult/porn/sex.

Expected: rejected.

## Duplicate test

Upload the same PDF twice.

Expected: second upload rejected with duplicate message.

## If upload works but file not visible

Go to:

Storage → resource-files → resources

Files are saved inside the `resources` folder, not directly in the bucket root.
