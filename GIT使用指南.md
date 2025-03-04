# Git使用指南 - Flomo笔记插件项目

## 基本概念

Git是一个版本控制系统，就像是您项目的时间机器，可以记录所有的变更，并允许您在需要时回到任何一个保存点。

## 常用命令

### 查看状态

```bash
git status
```

这个命令会显示哪些文件被修改了，哪些文件已经准备好提交。

### 查看变更内容

```bash
git diff
```

这个命令会显示您修改了哪些内容。

### 添加变更到暂存区

```bash
git add 文件名    # 添加特定文件
git add .        # 添加所有变更
```

这相当于告诉Git"我想把这些变更保存到下一个版本中"。

### 提交变更

```bash
git commit -m "描述您做了什么变更"
```

这会创建一个新的版本，包含您之前添加到暂存区的所有变更。

### 查看历史记录

```bash
git log          # 详细历史
git log --oneline # 简洁历史
```

这会显示所有的提交历史，包括谁在什么时候做了什么变更。

### 创建标签（版本号）

```bash
git tag -a v版本号 -m "版本描述"
```

例如：`git tag -a v1.1.0 -m "添加新功能xxx"`

### 切换到特定版本

```bash
git checkout 提交ID或标签名
```

例如：`git checkout v1.0.0`

### 回滚到之前的版本

```bash
git reset --hard 提交ID或标签名
```

例如：`git reset --hard v1.0.0`

**注意：这会丢弃当前的所有未提交变更，请谨慎使用！**

### 创建新分支（用于开发新功能）

```bash
git branch 分支名
git checkout 分支名
```

或者一步完成：

```bash
git checkout -b 分支名
```

### 合并分支

```bash
git checkout main     # 先切换到主分支
git merge 分支名       # 将指定分支合并到主分支
```

## 与GitHub集成

### 推送代码到GitHub

1. 在GitHub上创建一个新仓库
2. 关联远程仓库：
   ```bash
   git remote add origin https://github.com/用户名/仓库名.git
   ```
3. 推送代码：
   ```bash
   git push -u origin main
   ```

### 从GitHub克隆仓库

如果您想在另一台电脑上继续开发：
```bash
git clone https://github.com/用户名/仓库名.git
```

### 拉取最新代码

如果您在多台电脑上开发，或者有多人协作，可以使用以下命令获取最新代码：
```bash
git pull
```

### 使用GitHub身份验证

GitHub现在推荐使用个人访问令牌(PAT)而不是密码：
1. 在GitHub上创建PAT: Settings -> Developer settings -> Personal access tokens
2. 使用PAT代替密码进行身份验证

也可以使用SSH密钥进行无密码认证：
1. 生成SSH密钥：`ssh-keygen -t ed25519 -C "您的邮箱"`
2. 将公钥添加到GitHub: Settings -> SSH and GPG keys
3. 使用SSH URL克隆/推送：`git@github.com:用户名/仓库名.git`

## 典型工作流程

1. 查看状态：`git status`
2. 添加变更：`git add .`
3. 提交变更：`git commit -m "描述变更"`
4. 如果是重要版本，添加标签：`git tag -a v版本号 -m "版本描述"`

## 如何回滚到之前版本

如果您需要回滚到之前的版本，例如v1.0.0：

1. 查看所有标签：`git tag`
2. 回滚到特定标签：`git reset --hard v1.0.0`

## 注意事项

1. 经常提交变更，每次提交都应该有明确的目的
2. 提交信息应该清晰描述您做了什么变更
3. 重要版本发布时，记得添加标签
4. 在进行重大变更前，最好创建新分支
5. `.gitignore`文件用于指定不需要被Git跟踪的文件

## 学习资源

- [Git官方文档](https://git-scm.com/doc)
- [GitHub Git教程](https://docs.github.com/cn/get-started/using-git)
- [廖雪峰的Git教程](https://www.liaoxuefeng.com/wiki/896043488029600)
