"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

const MemberDetailsFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  name: z
    .string()
    .min(3, { message: "Name must be 3 to 20 characters long" })
    .max(20, { message: "Name must be 20 or less characters long" }),
});

export function InviteMember({ user }: { user: any }) {
  // const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const MemberDetailsForm = useForm({
    resolver: zodResolver(MemberDetailsFormSchema),
  });

  const sendMemberInvitation = async (data: FieldValues) => {
    try {
      setBusy(true);
      // create user if not exists
      await fetch(`/api/user?email=${data.email}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          team_id: user.teamId,
        }),
      });

      // TO DO
      // sendInviteEmail({
      //   first_name: data.first_name.toLowerCase(),
      //   last_name: data.last_name.toLowerCase(),
      //   email: data.email.toLowerCase(),
      // });
      queryClient.invalidateQueries({ queryKey: ["getUsers"] });
      toast.success("Team member invited successfully");
      setOpen(false);
    } catch (error) {
      toast.error(
        "An error occurred while inviting your team member. Please try again later."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button className="w-fit">
          <PlusCircleIcon className="mr-2 h-5 w-5" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite a new member to your team
          </DialogDescription>
        </DialogHeader>
        <Form {...MemberDetailsForm}>
          <form className="flex w-full flex-col gap-4">
            <FormField
              disabled={busy}
              control={MemberDetailsForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={MemberDetailsForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className="capitalize"
                      placeholder="John"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose disabled={busy}>
                <Button variant={"outline"}>Cancel</Button>
              </DialogClose>
              <Button
                disabled={busy}
                onClick={MemberDetailsForm.handleSubmit(sendMemberInvitation)}
                className="w-fit"
              >
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ManageRole({ member }: { member: any }) {
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState(member.role);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateUserRoleFunc = async (member: any, newRole: any) => {
    try {
      setBusy(true);
      await fetch(`/api/user?id=${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          role: newRole,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["getUsers"] });
      toast.success("Team member permissions updated successfully");
      setOpen(false);
    } catch (error) {
      toast.error(
        "An error occurred while changing member permissions. Please try again later"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Manage Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Manage the permissions of {member.name} ({member.email})
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          onValueChange={(value: any) => setType(value)}
          defaultValue={type}
        >
          <div className="flex items-center space-x-2 py-4">
            <RadioGroupItem value="user" id="r2" />
            <div className="flex flex-col gap-1">
              <Label htmlFor="r2">Member</Label>
              <p className="text-sm text-muted-foreground">
                Create projects and deploy AI models.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center space-x-2 py-4">
            <RadioGroupItem value="owner" id="r1" />
            <div className="flex flex-col gap-1">
              <Label htmlFor="r1">Owner</Label>
              <p className="text-sm text-muted-foreground">
                Admin-level permissions. Can manage team members and billing.
              </p>
            </div>
          </div>
        </RadioGroup>
        <Separator />
        <DialogFooter>
          <DialogClose disabled={busy} onClick={() => setOpen(false)}>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
          <Button
            disabled={busy}
            onClick={() => updateUserRoleFunc(member, type)}
            className="w-fit"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMemberDialog({ member }: { member: any }) {
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState(member.role);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const removeUser = async (member: any) => {
    try {
      setBusy(true);
      await fetch(`/api/user?id=${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          teamId: null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["getUsers"] }).then(() => {
        toast.success("Team member removed successfully");
      });
      setOpen(false);
    } catch (error) {
      toast.error(
        "An error occurred while removing a team member. Please try again later"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <button
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          Remove from team
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {member.name} {member.name} (
            {member.email}) from your team?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose disabled={busy} onClick={() => setOpen(false)}>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
          <Button
            variant={"destructive"}
            disabled={busy}
            onClick={() => removeUser(member)}
            className="w-fit"
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMember({ member }: { member: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={"icon"}>
          <DotsHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          <RemoveMemberDialog member={member} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MembersView({
  team,
  email,
}: {
  team: any;
  email: string;
}) {
  const fetchMembers = useQuery({
    queryKey: ["fetch-team-query"],
    queryFn: async () => {
      const response = await fetch(`/api/team?id=${team.id}`);
      const result = await response.json();
      return result;
    },
  });

  const fetchUser = useQuery({
    queryKey: ["fetch-user-query"],
    queryFn: async () => {
      const response = await fetch(`/api/user?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchMembers.isLoading ||
    !fetchMembers.data ||
    fetchUser.isLoading ||
    !fetchUser.data
  ) {
    return <MembersSettingsLoading />;
  }

  return (
    <>
      <InviteMember user={fetchUser.data.data} />
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage the current members of your team
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <Separator />
          {fetchMembers.data.data.users.map((member: any, idx: number) => (
            <>
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-4"
              >
                <div className="flex items-center gap-3">
                  {/* <ProfileAvatar email={member.email} size={30} /> */}
                  <div className="flex flex-col gap-1">
                    <p className="capitalize">{member.name}</p>
                    <span className="text-sm text-muted-foreground">
                      {member.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm capitalize text-muted-foreground">
                    {member?.status !== "invited" ? member.role : "invited"}
                  </p>
                  {fetchUser?.data.data.id !== member.id &&
                    fetchUser.data.data?.role === "owner" && (
                      <ManageRole member={member} />
                    )}
                  {fetchUser?.data.data.id !== member.id &&
                    fetchUser.data.data?.role === "owner" && (
                      <RemoveMember member={member} />
                    )}
                </div>
              </div>
              <Separator />
            </>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function MembersSettingsLoading() {
  return (
    <>
      <Button disabled={true} className="w-fit">
        <PlusCircleIcon className="mr-2 h-5 w-5" />
        Invite Member
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage the current members of your team
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <Separator />
          {[1, 2, 3].map((item: number, idx: number) => (
            <>
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-10" />
                  <Button disabled={true} variant="outline">
                    Manage Role
                  </Button>
                  <Button disabled={true} variant="outline" size={"icon"}>
                    <DotsHorizontalIcon />
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
