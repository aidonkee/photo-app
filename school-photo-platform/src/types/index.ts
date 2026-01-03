export type PageProps<T = {}> = {
    params: Promise<T>;
    searchParams?:  Promise<{ [key: string]: string | string[] | undefined }>;
  };
  
  export type LayoutProps = {
    children: React.ReactNode;
    params?:  Promise<{ [key: string]:  string }>;
  };
  
  // Re-export from other type files
  export * from './prisma';
  export * from './api';