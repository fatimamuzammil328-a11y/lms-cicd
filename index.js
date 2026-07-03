const { pool, ensureSchema } = require("./db");

function printHelp() {
  console.log(`
Notes CLI (backed by PostgreSQL)

Usage:
  node index.js add "<text>"     Add a new note
  node index.js list             List all notes
  node index.js done <id>        Mark a note as done
  node index.js delete <id>      Delete a note
  node index.js help             Show this help message
`);
}

async function addNote(text) {
  if (!text) {
    console.error("Error: note text is required. Example: add \"Buy milk\"");
    process.exitCode = 1;
    return;
  }
  const result = await pool.query(
    "INSERT INTO notes (text) VALUES ($1) RETURNING id",
    [text]
  );
  console.log(`Added note #${result.rows[0].id}: "${text}"`);
}

async function listNotes() {
  const result = await pool.query(
    "SELECT id, text, done, created_at FROM notes ORDER BY id"
  );
  if (result.rows.length === 0) {
    console.log("No notes yet. Add one with: node index.js add \"...\"");
    return;
  }
  for (const row of result.rows) {
    const status = row.done ? "[x]" : "[ ]";
    console.log(`${status} #${row.id} ${row.text}`);
  }
}

async function markDone(id) {
  if (!id) {
    console.error("Error: note id is required. Example: done 1");
    process.exitCode = 1;
    return;
  }
  const result = await pool.query(
    "UPDATE notes SET done = TRUE WHERE id = $1 RETURNING id",
    [id]
  );
  if (result.rowCount === 0) {
    console.log(`No note found with id ${id}`);
  } else {
    console.log(`Note #${id} marked as done`);
  }
}

async function deleteNote(id) {
  if (!id) {
    console.error("Error: note id is required. Example: delete 1");
    process.exitCode = 1;
    return;
  }
  const result = await pool.query(
    "DELETE FROM notes WHERE id = $1 RETURNING id",
    [id]
  );
  if (result.rowCount === 0) {
    console.log(`No note found with id ${id}`);
  } else {
    console.log(`Note #${id} deleted`);
  }
}

async function main() {
  const [, , command, ...args] = process.argv;

  try {
    await ensureSchema();

    switch (command) {
      case "add":
        await addNote(args.join(" "));
        break;
      case "list":
        await listNotes();
        break;
      case "done":
        await markDone(args[0]);
        break;
      case "delete":
        await deleteNote(args[0]);
        break;
      case "help":
      case undefined:
        printHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();