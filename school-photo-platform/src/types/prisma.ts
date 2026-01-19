import { Prisma } from '@prisma/client';

// School with relations
export type SchoolWithClassrooms = Prisma.SchoolGetPayload<{
  include: {
    classrooms: true;
  };
}>;

export type SchoolWithCounts = Prisma.SchoolGetPayload<{
  include:  {
    _count: {
      select: {
        classrooms: true;
        photos: true;
      };
    };
  };
}>;

// Classroom with relations
export type ClassroomWithSchool = Prisma.ClassroomGetPayload<{
  include: {
    school: true;
  };
}>;

export type ClassroomWithPhotos = Prisma.ClassroomGetPayload<{
  include: {
    photos: true;
    school: true;
  };
}>;

export type ClassroomWithCounts = Prisma.ClassroomGetPayload<{
  include: {
    school: true;
    _count:  {
      select: {
        photos: true;
        orders: true;
        editRequests: true;
      };
    };
  };
}>;

// Order with relations
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        photo: true;
      };
    };
  };
}>;

export type OrderWithClassroom = Prisma.OrderGetPayload<{
  include:  {
    classroom: {
      include: {
        school: true;
      };
    };
    items: {
      include: {
        photo: true;
      };
    };
  };
}>;

// Photo with relations
export type PhotoWithClassroom = Prisma.PhotoGetPayload<{
  include:  {
    classroom: {
      include: {
        school: true;
      };
    };
  };
}>;

// User with relations
export type UserWithSchools = Prisma.UserGetPayload<{
  include: {
    schools: true;
    _count: {
      select:  {
        schools: true;
      };
    };
  };
}>;

// Edit Request with relations
export type EditRequestWithClassroom = Prisma.EditRequestGetPayload<{
  include: {
    classroom: {
      include: {
        school:  true;
      };
    };
  };
}>;