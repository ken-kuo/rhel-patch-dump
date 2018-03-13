if (process.argv.length !== 5) {
    console.log("\n參數錯誤\n");
    console.log("正確格式: node app.js 下載網址 起始編號 結束編號\n");
    console.log("起始編號必須大於結束編號\n");
    console.log("範例 node app.js https://access.redhat.com/labs/psb/versions/kernel-3.10.0-327.22.2.el7/patches 11138 11000\n");
    process.exit();
}

let StartCodeNum = parseInt(process.argv[3]), EndCodeNum = parseInt(process.argv[4]);
let url = process.argv[2];
let page = Math.ceil(Math.abs(StartCodeNum - EndCodeNum) / 50);
const fs = require('fs');
const execFileSync = require('child_process').execFileSync;
const cheerio = require('cheerio');

getFileList(1);
download();

function getFileList(page) {



    let  getListPara = [
        "-d", "list/",
        "-o", "0.htm",
        "-j", "5",
        "-m", "10",
        "--retry-wait=10",
        "--load-cookies=conf/cookies.txt",
        "--header=x-requested-with:XMLHttpRequest",
        "--allow-overwrite",
        // "--log=history.txt",
        // "--log-level=info",
        url
    ];

    execFileSync('aria2c', getListPara);


    console.log('\x1b[32m%s\x1b[0m ', "---[INFO] fetch total code number---");

	let data = [], dumpListName = [];

	let name = "url";
	data.push(`${url}`);
	data.push(` out=${name}.htm`);
	dumpListName.push(`${name}.htm`);

	data = data.join("\n");

	fs.writeFileSync('FileList2.txt', data);
	console.log('\x1b[32m%s\x1b[0m ', "---[INFO] generate filelist Start---");





	getListPara = [
		"-d", "list/",
		"-j", "5",
		"-i", "FileList2.txt",
        "-m", "10",
        "--retry-wait=10",
		"--load-cookies=conf/cookies.txt",
		"--header=x-requested-with:XMLHttpRequest",
		//"--log=history.txt",
		//"--log-level=info",
		"--allow-overwrite"

	];


	execFileSync('aria2c', getListPara);
	getAllFileLink(dumpListName);

	console.log('\x1b[32m%s\x1b[0m ', "---[INFO] generate filelist Complete---");




}


function download() {
    let folder = url.split("/");


    if (!fs.existsSync("dl/" + folder[folder.length - 1])) {
        fs.mkdirSync("dl/" + folder[folder.length - 1]);
    }
    if (!fs.existsSync("dl/" + folder[folder.length - 1] + "/" + folder[folder.length - 3]))
    {
        fs.mkdirSync("dl/" + folder[folder.length - 1] + "/" + folder[folder.length - 3]);
    }

    folder = folder[folder.length - 1] + "/" + folder[folder.length - 3];
    console.log('\x1b[32m%s\x1b[0m ', "---[INFO] Download Start---");

    const spawn = require('child_process').spawn;
    let  DownloadPara = [
        "-d", `dl/${folder}`,
        "-j", "10",
        "-i", "FileList2.txt",
        "--load-cookies=conf/cookies.txt",
        //"--log=history.txt",
        //"--log-level=info",
        "--allow-overwrite"
    ];

    let aria = spawn('aria2c', DownloadPara);

    aria.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    aria.on('close', (code) => {
        console.log('\x1b[32m%s\x1b[0m ', "---[INFO] Download OK---");
    });

}

function getFirstCodeNum() {

    let data = fs.readFileSync('list/0.htm');

    $ = cheerio.load(data.toString());

    return parseInt($(".num").eq(0).text());
}


function padstring(str){
	var pad = "00000";
	var ans = pad.substring(0, pad.length - str.length) + str;
	return ans;
}

function getAllFileLink(dumpListName) {
    let num, data, links, linkArray = [];
    for (let i in dumpListName) {
        data = fs.readFileSync(`list/${dumpListName[i]}`);
        $ = cheerio.load(data.toString());
        links = $(".patch-link");
        for (let j = 0; j < links.length; j++) {
            let link = links.eq(j).attr("href");
            let name = link.split("/");
            name = name[name.length - 1];
			num = $(".num").eq(j+1).text();
			name = padstring(num) + "-" + name;
            linkArray.push("https://access.redhat.com/" + link + "?raw=true");
            linkArray.push(` out=${name}.patch`);
			console.log('\x1b[32m%s\x1b[0m ', "---[INFO] " + name + "---");
//            if (parseInt($(".num").eq(j+1).text()) === EndCodeNum) {
//                break;
//            }
        }


    }


    linkArray = linkArray.join("\n");

    fs.writeFileSync('FileList2.txt', linkArray);


    // console.log(linkArray.length);





}
