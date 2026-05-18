// Data loaders for Drupal GraphQL
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient(process.env.DRUPAL_GRAPHQL_ENDPOINT || 'http://localhost/graphql');

export async function loadAuthority(authority: any): Promise<void> {
  // TODO: Implement GraphQL mutation to create/update authority
  console.log('Loading authority:', authority.mcNumber);
}
