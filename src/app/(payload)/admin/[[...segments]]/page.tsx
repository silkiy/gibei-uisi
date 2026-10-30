import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import config from '@payload-config';
import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

export default async function AdminPage({ params, searchParams }: Args) {
  if ((await params).segments?.[0] === 'create-first-user') notFound();
  return RootPage({ config, params, searchParams, importMap });
}
