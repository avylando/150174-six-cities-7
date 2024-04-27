#!/usr/bin/env node

import { readFile } from "fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { TSVFileReader } from "./shared/index.js";

const filePath = fileURLToPath(import.meta.url);
const packageUrl = path.resolve(filePath, "../../package.json");
const packageJsonContent = JSON.parse(await readFile(packageUrl, "utf-8"));

const program = new Command();

program
  .name("node-tsv-parser")
  .description("Parse .tsv files with node")
  .version(packageJsonContent.version);

program
  .option(
    "-i, --import <path>",
    "Reads .tsv file and converts it into javascript objects"
  )
  .action((pathname) => {
    try {
      const reader = new TSVFileReader(pathname);
      reader.read();
      const result = reader.toArray();
      console.log(chalk.green("Reading successful: ", JSON.stringify(result)));
      process.exit(0);
    } catch (err) {
      console.log(chalk.red(`Error reading file: ${err}`));
      process.exit(1);
    }
  });

program.parse();
