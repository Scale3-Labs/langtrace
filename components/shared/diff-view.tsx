import { createPatch } from "diff";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css"; // Import default styles for react-diff-view

const DiffView = ({
  oldString,
  newString,
}: {
  oldString: string;
  newString: string;
}) => {
  // Generate unified diff
  const diffText = createPatch(
    "changes",
    oldString,
    newString,
    "Old version",
    "New version",
    { context: 4 }
  );

  // remove top 2 lines
  const diffTextArr = diffText.split("\n");
  diffTextArr.splice(0, 2);

  // Parse the diff to be used with react-diff-view
  const files = parseDiff(diffTextArr.join("\n"));

  // Render the diff using react-diff-view components
  return (
    <div className="overflow-y-scroll rounded-md">
      {files.map(({ hunks, oldPath, newPath, type }, i) => (
        <Diff
          key={i}
          viewType="split"
          diffType={type}
          hunks={hunks}
          className="rounded-md p-2"
        >
          {(hunks) =>
            hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
          }
        </Diff>
      ))}
    </div>
  );
};

export default DiffView;
