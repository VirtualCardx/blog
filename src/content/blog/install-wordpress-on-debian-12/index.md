---
title: "在Debian 12上手动安装Wordpress"
description: "想在Linux上建站？本文提供详细的Debian 12手动安装WordPress全流程教程。涵盖环境配置、数据库设置与WP安装，小白也能轻松搭建独立站。"
pubDate: 2025-02-06
updatedDate: 2026-10-24
tags: ["技术杂谈"]
draft: false
---

<figure class="wp-block-image size-full"><img src="./imgs/img20.webp" alt="" width="720" height="405" loading="lazy"></figure>



<h2 class="wp-block-heading">第一步：ssh登陆到Debian操作系统</h2>



<p class="wp-block-paragraph">ssh root@servername</p>



<h2 class="wp-block-heading">第二步：安装nginx、mariadb、php</h2>



<p class="wp-block-paragraph">1. 先更新源</p>



<pre class="wp-block-code"><code>apt-get update

apt-get upgrade</code></pre>



<p class="wp-block-paragraph">2. 安装nginx</p>



<pre class="wp-block-code"><code>apt install nginx

systemctl start nginx

systemctl enable nginx

apt install mariadb-server</code></pre>



<p class="wp-block-paragraph">3. 安装php及其附加组件</p>



<pre class="wp-block-code"><code>apt install php php-mysql php-gd php-xml php-mbstring php-curl php-fpm php-mysql php-imagick php-zip php-intl</code></pre>



<h2 class="wp-block-heading">第三步：配置mariadb数据库</h2>



<p class="wp-block-paragraph">1. 登录到数据库，mariadb的初始root密码为空</p>



<pre class="wp-block-code"><code>mysql -u root -p</code></pre>



<p class="wp-block-paragraph">2. 创建默认数据库</p>



<pre class="wp-block-code"><code>CREATE DATABASE &#91;wordpressdatabasename];</code></pre>



<p class="wp-block-paragraph">3. 创建wordpress数据库账号</p>



<pre class="wp-block-code"><code>CREATE USER '&#91;wordpressuser]'@localhost IDENTIFIED BY 'wordpresspassword';</code></pre>



<p class="wp-block-paragraph">4. 赋予读取数据库的权限</p>



<pre class="wp-block-code"><code>GRANT ALL PRIVILEGES ON &#91;wordpressdatabasename].* TO &#91;wordpressuser]@localhost IDENTIFIED BY 'wordpresspassword';</code></pre>



<pre class="wp-block-code"><code>FLUSH PRIVILEGES;</code></pre>



<pre class="wp-block-code"><code>EXIT;</code></pre>



<h2 class="wp-block-heading">第四步：配置nginx服务</h2>



<p class="wp-block-paragraph">1. 在nginx中创建并修改wordpress配置文件</p>



<pre class="wp-block-code"><code>nano /etc/nginx/sites-available/wordpress</code></pre>



<p class="wp-block-paragraph">配置文件如下：</p>







<pre class="wp-block-code"><code>server {
        listen 80;
        server_name <strong><mark style="background-color:rgba(0, 0, 0, 0);color:#e33d1b" class="has-inline-color">www.yourdomain.com</mark></strong> <strong><mark style="background-color:rgba(0, 0, 0, 0);color:#db2525" class="has-inline-color">yourdomain.com</mark>;</strong>
        root /var/www/wordpress;
        index index.php index.html index.htm;
        location / {
        try_files $uri $uri/ /index.php?$args;
}

location ~ .php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
}

location ~ /.ht {
        deny all;
}</code></pre>



<p class="wp-block-paragraph">2. 编辑nginx全局配置文件</p>



<pre class="wp-block-code"><code>nano /etc/nginx/nginx.conf</code></pre>



<p class="wp-block-paragraph">修改http{}节点</p>



<p class="wp-block-paragraph">添加</p>



<pre class="wp-block-code"><code>client_max_body_size 20m;</code></pre>



<p class="wp-block-paragraph">3. 将wordpress配置文件链接到网站配置文件夹下</p>



<pre class="wp-block-code"><code>ln -s /etc/nginx/sites-available/wordpress /etc/nginx/sites-enabled/</code></pre>



<p class="wp-block-paragraph">4. 测试配置是否正确</p>



<pre class="wp-block-code"><code>nginx -t
systemctl restart nginx</code></pre>



<ol start="4" class="wp-block-list"></ol>



<h2 class="wp-block-heading">第五步：配置PHP</h2>



<p class="wp-block-paragraph">编辑php配置文件</p>



<pre class="wp-block-code"><code>nano /etc/php/8.2/fpm/php.ini</code></pre>



<p class="wp-block-paragraph">修改以下参数：</p>



<pre class="wp-block-code"><code>max_execution_time = 1200<br>max_input_time = 1200<br>upload_max_filesize = 200M<br>post_max_size = 800m</code></pre>



<p class="wp-block-paragraph">重启php服务</p>



<pre class="wp-block-code"><code>service php8.2-fpm restart</code></pre>



<h2 class="wp-block-heading">第六步：下载并安装wordpress</h2>



<pre class="wp-block-code"><code>cd /tmp
curl -O https://wordpress.org/latest.tar.gz

tar xzvf latest.tar.gz
cp -a /tmp/wordpress/. /var/www/wordpress

chown -R www-data:www-data /var/www/wordpress</code></pre>
<hr>
<h2>2026 Debian WordPress 部署基线</h2><p>Debian 12 的包版本和默认服务配置会随安全更新变化；先按当前发行版和 WordPress 官方要求核对 PHP/MariaDB/Nginx 或 Apache 的兼容性。不要假设数据库 root 密码为空，也不要让 WordPress 使用数据库 root。创建仅限该数据库的独立用户和长随机密码，并将凭据置于 Web 根目录外的 <code>wp-config.php</code>（或受控密钥管理）。</p><p>部署顺序：更新系统并启用安全更新；创建最小权限数据库/用户；通过 HTTPS 下载并校验 WordPress；使用正确的文件所有权与最小权限；配置自动备份、更新策略、TLS、日志和监控。上线前执行安装向导后删除不需要的安装文件，禁止后台文件编辑，并验证恢复流程。</p><p><strong>官方资料：</strong><a href="https://wordpress.org/documentation/article/how-to-install-wordpress/">WordPress installation</a>；<a href="https://developer.wordpress.org/advanced-administration/security/hardening/">WordPress hardening</a>。</p>