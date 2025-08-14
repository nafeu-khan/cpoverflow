'use client';

import { sidebarLinks } from '@/constants/constants';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const LeftSidebar = () => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="background-light900_dark200 light-border custom-scrollbar no-scrollbar sticky left-0 top-0 flex h-screen flex-col justify-between overflow-y-auto border-r p-6 pt-36 shadow-light-300 dark:shadow-none max-sm:hidden lg:w-[266px]">
      <div className="flex flex-1 flex-col gap-6">
        {sidebarLinks.map((item) => {
          // Check if the current route is "active"
          const isActive =
            (pathname.includes(item.route) && item.route.length > 1) ||
            pathname === item.route;

          // Skip auth-required links if user is not authenticated
          if (item.authRequired && (!isAuthenticated || !user)) {
            return null;
          }

          // If route is '/profile', only show if user is logged in
          if (item.route === '/profile') {
            if (!isAuthenticated || !user) {
              return null;
            }
            // Dynamically append userId
            const profileRoute = `${item.route}/${user.id}`;

            return (
              <Link
                key={item.route}
                href={profileRoute}
                className={`${
                  isActive
                    ? 'primary-gradient rounded-lg text-light-900'
                    : 'text-dark300_light900'
                } flex items-center justify-start gap-4 bg-transparent p-4`}
              >
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={`${isActive ? '' : 'invert-colors'}`}
                />
                <p
                  className={`${
                    isActive ? 'base-bold' : 'base-medium'
                  } max-lg:hidden`}
                >
                  {item.label}
                </p>
              </Link>
            );
          }

          // Otherwise, just render the link
          return (
            <Link
              key={item.route}
              href={item.route}
              className={`${
                isActive
                  ? 'primary-gradient rounded-lg text-light-900'
                  : 'text-dark300_light900'
              } flex items-center justify-start gap-4 bg-transparent p-4`}
            >
              <Image
                src={item.imgURL}
                alt={item.label}
                width={20}
                height={20}
                className={`${isActive ? '' : 'invert-colors'}`}
              />
              <p
                className={`${
                  isActive ? 'base-bold' : 'base-medium'
                } max-lg:hidden`}
              >
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Show Log In/Sign Up only if user is NOT logged in */}
      {!isAuthenticated && (
        <div className="flex flex-col gap-3">
          {/* Log In */}
          <Link href="/sign-in">
            <Button className="small-medium btn-secondary min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none">
              <Image
                src="/assets/icons/account.svg"
                alt="log in"
                width={20}
                height={20}
                className="invert-colors lg:hidden"
              />
              <span className="primary-text-gradient max-lg:hidden">Log In</span>
            </Button>
          </Link>

          {/* Sign Up */}
          <Link href="/sign-up">
            <Button className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none">
              <Image
                src="/assets/icons/sign-up.svg"
                alt="sign up"
                width={20}
                height={20}
                className="invert-colors lg:hidden"
              />
              <span className="max-lg:hidden">Sign Up</span>
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
};

export default LeftSidebar;
