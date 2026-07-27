import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Returns false when sharing is unavailable so the caller can surface the
// right message; throws only on real I/O failure.
export async function exportTransactionsCsv(
  csv: string,
  filename = 'islemler.csv',
): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'İşlemleri Dışa Aktar',
    UTI: 'public.comma-separated-values-text',
  });
  return true;
}
