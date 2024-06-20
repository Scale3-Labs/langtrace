import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Button } from "../ui/button";

export default function HowTo({ link }: { link: string }) {
  return (
    <Link href={link} target="_blank">
      <Button
        className="absolute top-40 right-24 text-muted-foreground"
        variant={"outline"}
      >
        How to use this
        <QuestionMarkCircledIcon className="w-6 h-6 ml-2 text-muted-foreground" />
      </Button>
    </Link>
  );
}
