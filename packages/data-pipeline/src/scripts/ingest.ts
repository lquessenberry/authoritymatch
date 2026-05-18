import { fetchNewAuthorities } from '../sources/fmcsa';
import { loadAuthority } from '../loaders';

async function main() {
  console.log('Starting FMCSA data ingestion...');

  try {
    // Fetch new authorities (last 24 hours by default)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const authorities = await fetchNewAuthorities({ since });

    console.log(`Found ${authorities.length} new authorities`);

    // Load into Drupal
    for (const authority of authorities) {
      await loadAuthority(authority);
    }

    console.log('Ingestion complete');
  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  }
}

main();
