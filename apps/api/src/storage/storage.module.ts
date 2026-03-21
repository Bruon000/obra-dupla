import { Global, Module } from "@nestjs/common";
import { R2StorageService } from "./r2-storage.service";
import { AttachmentStorageService } from "./attachment-storage.service";
import { SupabaseModule } from "../supabase/supabase.module";
import { SupabaseStorageService } from "../supabase/supabase-storage.service";

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [R2StorageService, AttachmentStorageService],
  exports: [AttachmentStorageService],
})
export class StorageModule {}
