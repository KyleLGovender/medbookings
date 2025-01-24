import Link from "next/link";

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { getServiceProviderId } from "../../../lib/server-helper";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  const serviceProvider = session?.user?.id
    ? await getServiceProviderId(session.user.id)
    : null;

  return (
    <>
      <Card className="mx-auto mt-4 max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar>
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback>{session?.user?.name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <h4 className="text-sm font-semibold">
                {session?.user?.name ?? ""}
              </h4>
              <p className="text-sm text-muted-foreground">
                {session?.user?.email ?? ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mx-auto mt-4 max-w-md">
        <CardContent className="pt-6">
          <Link
            href={
              serviceProvider
                ? "/profile/service-provider"
                : "/profile/service-provider/registration"
            }
            className={buttonVariants({ className: "w-full" })}
          >
            {serviceProvider
              ? "View Service Provider Profile"
              : "Register as a Service Provider"}
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
