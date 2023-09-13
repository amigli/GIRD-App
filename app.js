import dotenv from "dotenv";
import {App} from "octokit";
import {createNodeMiddleware} from "@octokit/webhooks";
import fs from "fs";
import http from "http";
import {spawnSync} from "child_process";

dotenv.config();

const appId = process.env.APP_ID;
const webhookSecret = process.env.WEBHOOK_SECRET;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;

const privateKey = fs.readFileSync(privateKeyPath, "utf8");

const app = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret
  },
});

async function handleIssueOpened({ octokit, payload }) {
  console.log(`Received an issue event for #${payload.issue.number}`);
  try {
    const issueBody = payload.issue.body;
	//console.log(`issueBody: `, issueBody); e stampa giusto
	const process = spawnSync('python', ['run_model.py', issueBody]);
	console.log(`process: `, process);
	const prediction = process.stdout.toString().trim();
	console.log(`prediction: `, prediction);
	
	if (prediction == "1"){
		console.log(`La predizione è 1.`);
		const messageForNewIssues = "The issue seems to be related to privacy.";
		await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
		  owner: payload.repository.owner.login,
		  repo: payload.repository.name,
		  issue_number: payload.issue.number,
		  body: messageForNewIssues, 
		  headers: {
			"x-github-api-version": "2022-11-28",
		  },
		});
	}else if(prediction == "0"){
		console.log(`La previsione è 0.`);
		}else{
		console.log(`Nessuna previsione.`);
		}
   } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`);
    }
    console.error(error);
  }
}

app.webhooks.on("issues.opened", handleIssueOpened);

app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing issue: ${error.event}`);
  } else {
    console.error(error);
  }
});

const port = 3000;
const host = 'localhost';
const path = "/api/webhook";
const localWebhookUrl = `http://${host}:${port}${path}`;

const middleware = createNodeMiddleware(app.webhooks, {path});

http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`);
  console.log('Press Ctrl + C to quit.')
});