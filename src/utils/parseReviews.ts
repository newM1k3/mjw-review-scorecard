export function parseReviewText(text: string): string {
  return text.trim();
}

export async function parseCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        const ratingIndex = headers.findIndex(h => h.includes('rating') || h.includes('stars') || h.includes('score'));
        const textIndex = headers.findIndex(h => h.includes('comment') || h.includes('review') || h.includes('text') || h.includes('feedback'));

        if (ratingIndex === -1 && textIndex === -1) {
          reject(new Error('CSV must contain rating and/or review text columns'));
          return;
        }

        const reviews: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

          let reviewLine = '';
          if (ratingIndex !== -1 && values[ratingIndex]) {
            reviewLine += `Rating: ${values[ratingIndex]}`;
          }
          if (textIndex !== -1 && values[textIndex]) {
            if (reviewLine) reviewLine += ' - ';
            reviewLine += `Comment: ${values[textIndex]}`;
          }

          if (reviewLine) {
            reviews.push(reviewLine);
          }
        }

        resolve(reviews.join('\n'));
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
