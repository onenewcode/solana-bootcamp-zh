# 项目三：整合 Solana Blinks

Blinks 和 Actions 将区块链技术带到任何能够处理超链接的网站。在本项目中，我们将学习如何将 Blinks 集成到网站中，并使用它们与 Solana 智能合约进行交互。

---

## 🚀 运行本项目

```
npm i
anchor build
anchor test
```

---

## 📚 教程文档
- 在上一voting dapp项目的基础上，我们将加上“blinks”和“action”，把“投票”操作封装为 Action；
- 利用 Blink 机制，让用户无需传统前端即可完成投票；
- 项目将包括服务端 API（GET & POST）逻辑、交易构建与本地节点部署等步骤。

### 了解Actions and Blinks文档，安装 Solana Actions SDK

```bash

npm install @solana/actions

```

### 🧱 第一步：部署合约到本地验证节点（不是使用 bankrun）

在前一个项目中，我们使用的是 `Solana Bankrun` 来进行测试，但 **本项目需要你将智能合约实际部署到本地验证节点**，这样我们才能通过 Blink 与合约交互。

#### 🧭 检查当前配置

在部署前，先确认 Solana CLI 的配置：

```bash
solana config get

```

如果当前不是指向 `localhost`（即本地验证节点），请运行：

```bash

solana config set -ul 

```

可以看到会将所有配置设置成local

```jsx
Config File: /Users/<Username>/.config/solana/cli/config.yml
RPC URL: http://localhost:8899 
WebSocket URL: ws://localhost:8900/ (computed)
Keypair Path: /Users/<Username>/.config/solana/id.json 
Commitment: confirmed 
```

#### 🚀 部署 Anchor 智能合约

切换到 `anchor` 项目目录并执行：

```bash

anchor deploy

```

这条命令会将你在前一项目中编写的投票合约的二进制文件部署到本地验证节点上。

部署成功后，你将看到类似输出：

```

Deploying cluster: http://127.0.0.1:8899
Upgrade authority: /Users/<Username>/.config/solana/id.json
Deploying program "voting"...
Program path: /Users/<Username>/solana/solana-bootcamp-zh/project-2-voting-dapp/voting-dapp/anchor/target/deploy/voting.so...
Program Id: 8Dw2N5Ae1oePmGwFSQe1Yx68DcrepiU5mAfJC6w2kWTu

Signature: nbkBNGo8mUVB1D7mrgNM37CG47Mg5QwsMK3m6DZoHRwYg5ireDVEXJVpEe2ovCNJ9URCPAAzby6PmXgpXNYJ2vj

Deploy success

```

这是你的智能合约地址，你稍后将在代码和前端配置中使用它。

---

#### 🔎 可选：在浏览器中查看部署状态

访问 [explorer.solana.com](https://explorer.solana.com/)

点击右上角的“Cluster”选择 `Localhost` 模式，粘贴你的 Program ID，即可查看部署的合约详情，包括：

- 部署者地址
- 账户余额
- 是否可升级
- 是否可执行

---

### 🔗 第二步：准备集成 Actions 的环境

现在我们已经部署好合约，下一步是构建 GET / POST 请求，使我们能够通过 URL 和 Blink 实现无前端投票。

#### ✅ 创建 API 文件夹（Next.js）

我们将使用 `Next.js` 内置 API 功能来暴露服务端接口：

路径如下：

```bash

app/api/vote/route.ts

```

#### 创建 `GET` 请求初始代码

```tsx

export async function GET() {
  return Response.json({ message: "Hello from the API" });
}

```

你可以在浏览器访问：

```

http://localhost:3000/api/vote

```

看到返回内容：

```json
{ "message": "Hello from the API" }

```

说明你的服务器正在正常运行。

> 💡 注意：虽然 Next.js 对于构建完整的 DApp 是很有用的，但对于 Blink 这种场景来说，它偏重、资源消耗较大。生产环境建议使用更轻量的后端框架如nodejs或Express.js。
> 

---

### ⚙️ 第三步：构建 Action Metadata 返回内容（GET）

为了让 Blink 能够正常展示在社交媒体，我们需要返回结构化的 Metadata，包括图标、标题、描述和候选项等。

#### 示例结构（返回 JSON）

```tsx

import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
export async function GET() {
	const actionMetaData: ActionGetResponse =
    {
      icon: "https://hips.hearstapps.com/hmg-prod/images/fruit-mix-royalty-free-image-1729839128.jpg?crop=1xw:1xh;center,top&resize=980:*",
      title: "投票你最喜欢的颜色",
      description: "请选择你喜欢的是红色还是蓝色？",
      label: "Vote",
    };
  return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS });

}

```

这段代码构建了一个完整的 Action Metadata：

| 字段 | 说明 |
| --- | --- |
| `icon` | 展示在 Blink 上的图标 |
| `title` | Blink 的主标题 |
| `description` | 提示用户可执行的操作 |
| `links` | 可点击的投票选项列表，实际会发出 POST 请求 |

---

### 🔍 第四步：预览 Blink 效果

使用 [https://dial.to](https://dial.to/) 进行本地测试：

在浏览器中访问：

```bash
https://dial.to?action=solana-action:http://localhost:3000/api/vote

```

你应该会看到一个 Blink 卡片，包括：

- 图标（颜色）
- 标题、描述
- 两个按钮：投票给蓝色 / 红色

在我们完成post的端到端开发之前，我们还需要创建一个 Options 选项返回请求，直接加一句

```bash
export const OPTIONS = GET;
```

---


我们已经完成了 GET 请求部分的构建，接下来我们将继续实现 **POST 请求逻辑**，以便用户点击“投票”按钮后可以实际生成并签署一笔链上交易。

### 🧾 第五步：实现 POST 请求 —— 生成 Solana 交易

用户在 Blink 上点击“投票”按钮后，会触发一个 `POST` 请求。我们需要在服务端生成一笔可签名交易，并将其返回给用户钱包。

但我们只有Vote按钮是不够的，回到文档，发现可以使用links让用户操作


```bash

import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";

export const OPTIONS = GET;

export async function GET() {
	const actionMetaData: ActionGetResponse =
    {
      icon: "https://pic.616pic.com/bg_w1180/00/00/65/dRpPFYLhQY.jpg",
      title: "投票你最喜欢的颜色",
      description: "请选择你喜欢的是红色还是蓝色？",
      label: "Vote",
      links: 
        {
            actions: [
                {
                    label: "Vote for Blue",
                    href: "api/vote?candidate=blue",
                },
                {
                    label: "Vote for Red",
                    href: "api/vote?candidate=red", 
                }
            ]
        },
    };
  return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS });

}

```

现在就有了label和用户实际能操作的actions

---

#### ✅ 完整 POST 实现示例

```tsx
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const candidate = searchParams.get("candidate");

    if (!candidate || (candidate !== "blue" && candidate !== "red")) {
        return Response.json(
            { error: "Invalid candidate. Please choose 'blue' or 'red'." },
            { status: 400, headers: ACTIONS_CORS_HEADERS }
        );
    }

    return Response.json(
        { message: `You voted for ${candidate}.` },
        { headers: ACTIONS_CORS_HEADERS }
    );
}
```

---

现在有了candidate，我们需要来创建transaction来发送回server

要创建transaciton，我们需要blockhash，需要message，需要任何可能被加到transaction的签名。我们的transaction不需要在server侧有任何签名，

```tsx
const connection = new Connection("https://127.0.0.1:8899", "confirmed");
```

“confirmed”这里是commitment status，意思是我们有一些commitment状态，有”processed”, “confirmed”, “finalized”，这些状态等级告诉我们有多确定transaction上到集群上的确定性。

processed：found了，但还没confirmed

confirmed: 被66%的cluster confirmed了

finalized: 被66%的cluster confirmed了，后面的31个区块blocks也confirmed

一般来讲用confirmed就好了，截止到目前为止，还没有一个交易是confirmed但没有finalized的

下一步我们需要从URL获取所有信息，也就是用户用blinks来签名的URL，以成功创建交易

```tsx
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const candidate = searchParams.get("candidate");

    if (!candidate || (candidate !== "blue" && candidate !== "red")) {
        return Response.json(
            { error: "Invalid candidate. Please choose 'blue' or 'red'." },
            { status: 400, headers: ACTIONS_CORS_HEADERS }
        );
    }

    return Response.json(
        { message: `You voted for ${candidate}.` },
        { headers: ACTIONS_CORS_HEADERS }
    );

    const connection = new Connection("https://127.0.0.1:8899", "confirmed");

    const body: ActionPostRequest = await request.json();
    let voter;

    try {
        voter = new PublicKey(body.account);
    } catch (error) {
        return new Response("Invalid account address", {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
    const instruction = await program.methods
    .vote(candidate as string, new BN(1))
    .accounts({
        signer: voter,
    })
    .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);

    const response = await createPostResponse({
        fields: {
            transaction: transaction
        }
    });
    
    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
```

#### 🔍 测试你的 POST 请求

1. 启动前端：
    
    ```bash
    
    npm run dev
    
    ```
    
2. 刷新 dial.to 上的 Blink 页面，点击某个投票按钮：
    
    ```
    
    https://dial.to?action=solana:http://localhost:3000/api/vote
    
    ```
    
3. 钱包应弹出签名请求，内容为你刚刚生成的链上投票交易。

---

### 🧪 第六步：确保链上存在投票数据（poll & candidates）

⚠️ 重要提示：

你必须**先创建投票（poll）和候选人账户（candidate）**，否则生成的交易指令会失败。

推荐方法：**复用之前的测试代码来初始化数据**

更改原先逻辑为初始化设置workspace：

```tsx
describe('Voting', () => {
  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  let votingProgram = anchor.workspace.Voting as Program<Voting>;
  ...
```

```bash

anchor deploy
anchor test --skip-local-validator

```

如果你之前的 `tests/voting.ts` 中已经写好了 `initializePoll` 和 `initializeCandidate` 测试，就能在本地链上创建好 poll 和候选人账户。

---

### ✅ 结尾测试 & 验证

- 再次访问你的 Blink 页面（dial.to）
- 点击“投票给red/blue”按钮
- 看到钱包弹出窗口并成功签名
- 在 `solana explorer` 选择 `localhost` 模式查看你的 programId，能看到投票交易上链

### 📌 项目回顾：我们做了什么？

在本项目中，我们基于前一节的投票智能合约，实现了将投票操作集成到网页和社交媒体中，**无需传统前端界面**，只需点击一个链接就能完成链上投票。

### ✅ 整体流程概览

| 步骤 | 内容 |
| --- | --- |
| 📦 安装 SDK | 安装 `@solana/actions` 以构建 Blink 接口 |
| 🚀 部署合约 | 将 Anchor 合约部署到本地验证节点（非 bankrun） |
| 🔧 构建 API | 使用 `Next.js` 构建 `/api/vote` 的 `GET` 与 `POST` 请求 |
| 🔗 生成 Blink | 返回 Action Metadata，支持在 dial.to 等平台渲染可点击投票链接 |
| 🧾 构建交易 | POST 请求根据候选人信息和用户地址生成 Solana 交易 |
| 📤 钱包交互 | 用户点击投票按钮，钱包弹出交易签名请求并提交到本地链 |
| 🗳 初始化投票数据 | 通过测试代码创建 poll 和候选人账户，使投票功能可用 |
