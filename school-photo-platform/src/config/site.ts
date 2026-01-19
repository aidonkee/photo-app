export const siteConfig = {
    name:  'School Photo Platform',
    description: 'Professional school photography management platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
    links: {
      github: 'https://github.com/yourusername/school-photo-platform',
      support: 'mailto:support@schoolphoto.com',
    },
    nav: {
      main: [
        {
          title: 'Home',
          href: '/',
        },
        {
          title: 'About',
          href: '/about',
        },
        {
          title: 'Contact',
          href: '/contact',
        },
      ],
      superAdmin: [
        {
          title: 'Dashboard',
          href: '/dashboard',
        },
        {
          title: 'Photographers',
          href: '/admins',
        },
      ],
      admin: [
        {
          title: 'Dashboard',
          href: '/admin/dashboard',
        },
        {
          title: 'Schools',
          href: '/admin/schools',
        },
        {
          title: 'Requests',
          href: '/admin/requests',
        },
      ],
      teacher: [
        {
          title: 'Dashboard',
          href: '/teacher-dashboard',
        },
        {
          title: 'Orders',
          href: '/classroom/orders',
        },
      ],
    },
  };