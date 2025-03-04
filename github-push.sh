#!/bin/bash

# 请将以下变量替换为您的GitHub用户名和仓库名
GITHUB_USERNAME="Rimon-X"
REPO_NAME="flomo-plugin"

# 关联远程仓库
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

# 推送代码到GitHub
git push -u origin main

echo "完成！您的代码已推送到 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
