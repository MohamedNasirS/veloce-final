import * as path from 'path';
import * as fs from 'fs/promises';

export class FileManager {
  private static readonly UPLOAD_BASE_PATH = path.join(process.cwd(), 'uploads', 'documents');

  static generateUserFolderName(userId: string, email: string, company: string): string {
    const cleanCompany = company
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const cleanEmail = email.replace(/[@.]/g, '_');
    
    return `${userId}_${cleanCompany}_${cleanEmail}`;
  }

  static async createUserFolder(userFolderName: string): Promise<string> {
    const userFolderPath = path.join(this.UPLOAD_BASE_PATH, userFolderName);
    await fs.mkdir(userFolderPath, { recursive: true });
    return userFolderPath;
  }

  static async createDocumentTypeFolder(userFolderPath: string, documentType: string): Promise<string> {
    const typeFolderPath = path.join(userFolderPath, documentType);
    await fs.mkdir(typeFolderPath, { recursive: true });
    return typeFolderPath;
  }

  static generateFileName(documentType: string, originalName: string): string {
    const timestamp = Date.now();
    const fileExtension = path.extname(originalName);
    return `${documentType}_${timestamp}${fileExtension}`;
  }

  static async saveFile(filePath: string, fileBuffer: Buffer): Promise<void> {
    await fs.writeFile(filePath, fileBuffer);
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  static async deleteUserFolder(userFolderName: string): Promise<void> {
    try {
      const userFolderPath = path.join(this.UPLOAD_BASE_PATH, userFolderName);
      await fs.rmdir(userFolderPath, { recursive: true });
    } catch (error) {
      console.error('Error deleting user folder:', error);
    }
  }
}