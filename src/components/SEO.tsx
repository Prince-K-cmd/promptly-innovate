
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
}

const defaultDescription = "Create, store, and discover powerful prompts with Promptiverse";
const defaultImage = "https://lovable.dev/opengraph-image-p98pqg.png";

const SEO = ({
  title,
  description = defaultDescription,
  canonical,
  image = defaultImage,
  type = 'website'
}: SEOProps) => {
  const siteTitle = title ? `${title} | Promptiverse` : 'Promptiverse - Your Ultimate Prompt Library';
  
  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* OpenGraph tags */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={image} />
      
      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
