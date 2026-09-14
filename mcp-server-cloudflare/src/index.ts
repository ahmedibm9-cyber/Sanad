import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { R2Tools } from "./r2Tools.js";
import { env } from "./env.js";

// Create MCP server
const server = new McpServer({
  name: "sanad-cloudflare-r2",
  version: "1.0.0"
});

// Initialize R2 tools
const r2Tools = new R2Tools();

// Register R2 tools
server.tool(
  "r2_upload",
  {
    key: z.string().describe("The object key (path) in the R2 bucket"),
    contentType: z.string().describe("MIME type of the content"),
    body: z.string().describe("Base64 encoded content to upload"),
    metadata: z.record(z.string()).optional().describe("Optional metadata key-value pairs")
  },
  async ({ key, contentType, body, metadata }) => {
    try {
      const buffer = Buffer.from(body, 'base64');
      const result = await r2Tools.uploadToR2(key, buffer, contentType, metadata);
      return {
        content: [
          {
            type: "text",
            text: `Successfully uploaded file to R2:\nKey: ${result.key}\nURL: ${result.url}\nSize: ${result.size} bytes\nContent-Type: ${result.contentType}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to upload file to R2: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "r2_download",
  {
    key: z.string().describe("The object key (path) in the R2 bucket to download")
  },
  async ({ key }) => {
    try {
      const result = await r2Tools.downloadFromR2(key);
      return {
        content: [
          {
            type: "text",
            text: `File downloaded successfully:\nKey: ${result.key}\nSize: ${result.body.length} bytes\nContent-Type: ${result.contentType}`
          }
        ],
        // Also return the file data as a blob/resource if needed
        // For now, we'll return metadata and suggest using presigned URL for actual download
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to download file from R2: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "r2_delete",
  {
    key: z.string().describe("The object key (path) in the R2 bucket to delete")
  },
  async ({ key }) => {
    try {
      await r2Tools.deleteFromR2(key);
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted object from R2: ${key}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete object from R2: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "r2_list",
  {
    prefix: z.string().optional().describe("Optional prefix to filter objects"),
    limit: z.number().int().min(1).max(1000).default(100).describe("Maximum number of objects to return")
  },
  async ({ prefix, limit }) => {
    try {
      const objects = await r2Tools.listObjects(prefix, limit);
      return {
        content: [
          {
            type: "text",
            text: `Found ${objects.length} objects in R2 bucket:\n${objects.map(obj => `- ${obj.key} (${obj.size} bytes, ${obj.lastModified.toISOString()})`).join('\n')}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list objects in R2: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "r2_presigned_upload_url",
  {
    key: z.string().describe("The object key (path) where the file will be uploaded"),
    contentType: z.string().describe("MIME type of the content to be uploaded"),
    expiresIn: z.number().int().min(60).max(86400).default(3600).describe("URL expiration time in seconds (default: 1 hour)")
  },
  async ({ key, contentType, expiresIn }) => {
    try {
      const { url } = await r2Tools.getPresignedUploadUrl(key, contentType, { expiresIn });
      return {
        content: [
          {
            type: "text",
            text: `Presigned upload URL generated successfully:\nURL: ${url}\nExpires in: ${expiresIn} seconds\nKey: ${key}\n\nUse this URL with a PUT request to upload your file directly to R2.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to generate presigned upload URL: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "r2_presigned_download_url",
  {
    key: z.string().describe("The object key (path) of the file to download"),
    expiresIn: z.number().int().min(60).max(86400).default(3600).describe("URL expiration time in seconds (default: 1 hour)")
  },
  async ({ key, expiresIn }) => {
    try {
      const url = await r2Tools.getPresignedDownloadUrl(key, { expiresIn });
      return {
        content: [
          {
            type: "text",
            text: `Presigned download URL generated successfully:\nURL: ${url}\nExpires in: ${expiresIn} seconds\nKey: ${key}\n\nUse this URL to download the file directly from R2.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to generate presigned download URL: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cloudflare R2 MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});