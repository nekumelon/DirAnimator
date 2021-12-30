const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const settingsPath = `${process.env['APPDATA']}/Code/User/settings.json`;                                        

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function setSetting(setting, value) {               
	fs.readFile(settingsPath, 'utf8', (err, data) => {
		if (err) throw err;

		let settings = JSON.parse(data);
		settings[setting] = value;
		fs.writeFile(settingsPath, JSON.stringify(settings), () => {});
	});
}

function activate(context) {
	const animate = vscode.commands.registerCommand('DirAnimator.animate', async() => {
		const configuration = vscode.workspace.getConfiguration('DirAnimator');
		const outputDirectory = configuration.get('outputDirectory');
		const newCharacterDelay = configuration.get('newCharacterDelay');
		const ignoreList = configuration.get('ignoreList');
		const allowedExtensions = configuration.get('allowedExtensions');

		await setSetting('editor.wordWrap', 'on');

		const folders = vscode.workspace.workspaceFolders;

		if (folders.length == 0) {
			console.log('There must be a folder in the workspace to animate');

			return;
		}

		const folder = vscode.workspace.workspaceFolders[0];
		const folderPath = folder.uri.fsPath;
		console.log(`Animating ${folder.name}...`);

		/*
		* Modified from https://stackoverflow.com/a/5827895
		* 
		* I haven't really looked at this very much so it probably isn't the best for what it needs to do
		* I'm not going to look at it either since it doesn't matter too much
		*/
		function recurseDirectory(directory, callback) {
			let results = [];

			fs.readdir(directory, function(err, files) {
				if (err) return callback(err);

				files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
				let pending = files.length;

				if (!pending) return callback(null, results);

				files.forEach(function(file) {
					let skip = false;
					file = path.resolve(directory, file);

					for (let flag of ignoreList) {
						if (file == flag) {
							skip = true;

							break;
						}
					}

					fs.stat(file, function(err, stat) {
						if (stat && stat.isDirectory()) {
							recurseDirectory(file, function(err, res) {
								if (!skip) {
									results = results.concat(res);
								}

								if (!--pending) callback(null, results);
							});
						} else {
							if (!skip) {
								skip = true;

								for (let allowed of allowedExtensions) {
									if (path.extname(file) == allowed) {
										skip = false;
		
										break;
									}
								}
							}
							
							if (!skip) {
								results.push(file);
							}

							if (!--pending) callback(null, results);
						}
					});
				});
			});
		}

		recurseDirectory(folderPath, async(err, recursed) => {
			if (err) throw err;

			console.log(`Finished recursing. Directory length: ${recursed.length}`);

			function animateFiles(files, i) {
				const file = files[i];

				fs.readFile(file, 'utf8', async(err, data) => {
					if (err) throw err;

					const lines = data.split('\n');
					const newPath = path.join(outputDirectory, file.replace(folderPath, ''));
					const newDirectory = newPath.substring(0, newPath.lastIndexOf(newPath.includes('\\') ? '\\' : '/'));

					await fs.mkdir(newDirectory, { recursive: true }, () => {});
					
					fs.writeFile(newPath, '', async err => {
						if (err) throw err;

						const document = await vscode.workspace.openTextDocument(newPath);
						await vscode.window.showTextDocument(document);
						const editor = vscode.window.activeTextEditor;

						for (let i = 0; i < lines.length; i++) {
							const line = '\n' + lines[i];
							
							if (i >= 23) {
								await vscode.commands.executeCommand('editorScroll', {
									to: 'down',
									by: 'line',	
									value: 1,
									revealCursor: true
								});
							}

							for (let j = 0; j < line.length; j++) {
								await editor.edit(editBuilder => {
									editBuilder.insert(new vscode.Position(i, j), line[j]);
								});

								const newSelection = editor.selection.active.with(i, j);
								editor.selection = new vscode.Selection(newSelection, newSelection);
								
								await sleep(newCharacterDelay);
							}
						}
						
						document.save();
						animateFiles(files, i + 1);
					});
				});
			}

			animateFiles([...recursed], 0);
		});
	});

	context.subscriptions.push(animate);
}

async function deactivate() { }

module.exports = {
	activate,
	deactivate
};
