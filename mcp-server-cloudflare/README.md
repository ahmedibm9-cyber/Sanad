# SANAD Cloudflare R2 MCP Server

An MCP (Model Context Protocol) server that provides secure access to Cloudflare R2 storage for AI agents.

## Features

- Upload files to R2 buckets
- Download files from R2 buckets  
- Delete files from R2 buckets
- List objects in R2 buckets
- Generate presigned URLs for direct upload/download
- Company-scoped key generation (matches SANAD existing patterns)
- Environment variable based configuration (no hardcoded credentials)
- MCP tools with proper schemas, descriptions, and hints

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your Cloudflare R2 credentials:

```bash
cp .env.example .env
# Edit .env with your actual values
```

**Important**: Never commit your `.env` file. It's already ignored by git via the parent `.env*` rule.

### 3. Build the Server

```bash
npm run build
```

### 4. Run the Server

For development (auto-reloads):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will run as a Streamable HTTP MCP server on stdio by default, suitable for use with `opencode mcp auth`.

## Usage with Opencode

Once the server is running, you can authenticate and use it with opencode:

```bash
# Authenticate with the MCP server
opencode mcp auth cloudflare

# Then use MCP tools in your prompts:
# "Upload this file to R2: [file content]"
# "List all files in the R2 bucket"
# "Get a presigned download URL for key: companies/123/materials/456/image.png"
```

## Available MCP Tools

### r2_upload
Upload a file to R2
- `key`: The object key (path) in the R2 bucket
- `contentType`: MIME type of the content  
- `body`: Base64 encoded content to upload
- `metadata`: Optional metadata key-value pairs

### r2_download
Download a file from R2 (returns metadata)
- `key`: The object key (path) in the R2 bucket to download

### r2_delete
Delete a file from R2
- `key`: The object key (path) in the R2 bucket to delete

### r2_list
List objects in R2 bucket
- `prefix`: Optional prefix to filter objects (default: "")
- `limit`: Maximum number of objects to return (default: 100, max: 1000)

### r2_presigned_upload_url
Generate a presigned URL for direct upload to R2
- `key`: The object key where the file will be uploaded
- `contentType`: MIME type of the content to be uploaded
- `expiresIn`: URL expiration time in seconds (default: 3600)

### r2_presigned_download_url
Generate a presigned URL for direct download from R2
- `key`: The object key of the file to download
- `expiresIn`: URL expiration time in seconds (default: 3600)

## Security Notes

- This server is designed to run in a trusted environment (your server, Cloudflare Worker, etc.)
- Credentials are read only from environment variables - never hardcoded
- The server validates that required credentials are present before starting
- All operations are scoped to the specific R2 bucket configured
- Follows least privilege principle - only exposes necessary R2 operations

## Error Handling

All MCP tools return proper error responses with `isError: true` when operations fail, providing actionable error messages to help the AI agent understand what went wrong and how to fix it.

## Development

- Run `npm run dev` for automatic restart on file changes
- Run `npm run test` to execute tests (when implemented)
- Run `npm run build` to compile TypeScript to JavaScript