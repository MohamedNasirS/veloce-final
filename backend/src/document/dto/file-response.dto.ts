// backend/src/document/dto/file-response.dto.ts
export class FileResponseDto {
  id: string;
  filename: string;
  mimetype: string;
  fileSize: number;
  storagePath: string;
  uploadTimestamp: Date;
  relatedItemId?: string;
  uploadedByUserId: number;
}
