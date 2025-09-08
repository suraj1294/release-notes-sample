const git = require("simple-git")();

const { execSync } = require("child_process");

const getPrevTag = async () => {
  const command = `git describe --tags --abbrev=0 HEAD^`;
  const tags = await execSync(command).toString().trim().split("\n");

  console.log(tags);
  if (tags.length === 0) {
    throw new Error("No tags found in the repository.");
  }
  //const sortedTags = tags.sort((a, b) => new Date(b.date) - new Date(a.date));
  return tags[0];
};

const getLogsFromLastTag = async () => {
  //raw git command to get commits from pre tag
  //const cmd = `git log ${}..HEAD --pretty=format:"%h - %s"`;

  const prevTag = await getPrevTag();
  const cmd = `git log -1 ${prevTag}..HEAD --pretty=format:'{
"hash": "%H",
"date": "%ad",
"message": "%s",
"refs": "%d",
"body": "%b",
"author_name": "%an",
"author_email": "%ae"
}'`;

  const logs1 = await execSync(cmd).toString().trim();

  console.log(JSON.parse(logs1));

  const logs = await git.log({ from: prevTag });

  return logs.all;
};

(async () => {
  const logs = await getLogsFromLastTag();
  console.log("Commit logs:", logs);

  // Filter customer-facing commits
  const customerCommits = logs.filter(
    (c) => c.message.match(/^(feat|fix)/) && c.message.includes("#public")
  );

  console.log("Customer-facing commits:", customerCommits);
})();

//getlogs()

// const commitMessages = logs.all.map(commit => {
//   const message = commit.message;
//   const parts = message.split(':');
//   if (parts.length < 2) {
//     return null;
//   }
//   const type = parts[0].trim();
//   const description = parts.slice(1).join(':').trim();
//   return { type, description };
// }
// );
// const filteredMessages = commitMessages.filter(message => message !== null);
// const types = filteredMessages.map(message => message.type);
// const uniqueTypes = [...new Set(types)];
// const typeCounts = uniqueTypes.map(type => {
//   const count = types.filter(t => t === type).length;
//   return { type, count };
// });
// const sortedTypeCounts = typeCounts.sort((a, b) => b.count - a.count);
// const typeCountsString = sortedTypeCounts.map(tc => `${tc.type}: ${tc.count}`).join('\n');
// const output = `## Commit Types
// ${typeCountsString}
// ## Commit Messages
// ${filteredMessages.map(message => `- ${message.type}: ${message.description}`).join('\n')}
// `;
// console.log(output);
