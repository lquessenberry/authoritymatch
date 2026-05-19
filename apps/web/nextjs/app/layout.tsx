import Container from "@/components/Container";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { MainMenuQuery, FooterMenuQuery } from "@/graphql/queries";
import { getClientWithAuth, hasDrupalConfig } from "@/utils/client.server";
import getConfig from 'next/config';

import './globals.css'

const { publicRuntimeConfig } = getConfig();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let menuData: any = null
  let footerData: any = null

  if (hasDrupalConfig()) {
    const client = await getClientWithAuth();

    const { data: queriedMenuData, error: menuError } = await client.query(MainMenuQuery, {});

    if (menuError) {
      throw menuError;
    }
    menuData = queriedMenuData

    const { data: queriedFooterData, error: footerError } = await client.query(FooterMenuQuery, {});

    if (footerError) {
      throw footerError;
    }
    footerData = queriedFooterData
  }

  return (
    <html lang="en">
      <body>
        <Container>
          <Header
            mainMenu={menuData?.menu || null}
            config={publicRuntimeConfig}
          />
          {children}
          <Footer footerMenu={footerData?.menu || null} />
        </Container>
      </body>
    </html>
  );
}
