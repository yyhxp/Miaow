@import "common.js"

var previewKey = "com.sketchplugins.wechat.preview.";
var previewWrapKey = "com.sketchplugins.wechat.previewwrap";

var getCurrentPagesObject = function(context){
	return JSON.parse(NSUserDefaults.standardUserDefaults().objectForKey(previewKey+context.document.currentPage().objectID()) || '{"index":{},"dialog":{},"fixed":{},"back":{}}');
}

var getConnectionsInPage = function(page) {
	var connectionsLayerPredicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo, 'valueForKeyPath:', %@).isConnectionsContainer == true", previewWrapKey);
	return page.children().filteredArrayUsingPredicate(connectionsLayerPredicate).firstObject();
}

var setIndex = function(context){
	var newPreviewObject = getCurrentPagesObject(context);
	if(context.selection.length==0){
		return NSApp.displayDialog('请选中 artboard 进行设置');
	}else{
		var selection = context.selection[0];
		if(selection.className() != 'MSArtboardGroup'){
			return NSApp.displayDialog('请选中 artboard 进行设置');
		}
		newPreviewObject['index'] = {};
		newPreviewObject['index'][selection.objectID()] = {main:decodeURIComponent(encodeURIComponent(selection.objectID()))};
		context.command.setValue_forKey_onLayer_forPluginIdentifier(selection.objectID(), "indexMain", selection, previewKey+context.document.currentPage().objectID());
		NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(newPreviewObject),previewKey+context.document.currentPage().objectID());
		buildPreview(context);
	}
}

var setDialog = function(context){
	var fx = 0;
	function chooseDialog(){
		var settingsWindow = COSAlertWindow.new();
		settingsWindow.addButtonWithTitle('确定');
		settingsWindow.addButtonWithTitle('取消');

		settingsWindow.setMessageText('请选择从何处划入');
	    
		var ButtonList = ['下边入','上边入','左边入','右边入','无动画'];

		fx = createRadioButtons(ButtonList,0);
		settingsWindow.addAccessoryView(fx);
		return settingsWindow.runModal();
	}
	if(context.selection.length==0){
		return NSApp.displayDialog('请选中 artboard 进行设置');
	}else{
		var selection = context.selection[0];
		if(selection.className() != 'MSArtboardGroup'){
			return NSApp.displayDialog('请选中 artboard 进行设置');
		}
		if(chooseDialog() != '1000'){
			return;
		}

		var newPreviewObject = getCurrentPagesObject(context);

		fx = fx.selectedCell();
		var index = [fx tag];
		var direction = '';
		if(index == 0){
			direction = 'b';
		}else if(index == 1){
			direction = 't';
		}else if(index == 2){
			direction = 'l';
		}else if(index == 3){
			direction = 'r';
		}
		newPreviewObject.dialog[selection.objectID()] = {direction:direction,main:decodeURIComponent(encodeURIComponent(selection.objectID()))};
		context.command.setValue_forKey_onLayer_forPluginIdentifier(selection.objectID(), "dialogMain", selection, previewKey+context.document.currentPage().objectID());
		NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(newPreviewObject),previewKey+context.document.currentPage().objectID());
		buildPreview(context);
		
	}
}

var setFixed = function(context){
	var fx = 0;
	function chooseDialog(){
		var settingsWindow = COSAlertWindow.new();
		settingsWindow.addButtonWithTitle('确定');
		settingsWindow.addButtonWithTitle('取消');

		settingsWindow.setMessageText('请选择固定方向');
	    
		var ButtonList = ['上固定','下固定'];

		fx = createRadioButtons(ButtonList,0);
		settingsWindow.addAccessoryView(fx);
		return settingsWindow.runModal();
	}
	if(context.selection.length==0){
		return NSApp.displayDialog('请选中元素进行设置');
	}else{
		var selection = context.selection[0];
		if(selection.className() == 'MSArtboardGroup'){
			return NSApp.displayDialog('请选中元素进行设置');
		}
		if(!chooseDialog()){
			return;
		}

		var newPreviewObject = getCurrentPagesObject(context);
		fx = fx.selectedCell();
		var index = [fx tag];
		var direction = 't';
		if(index == 0){
			direction = 't';
		}else if(index == 1){
			direction = 'b';
		}
		
		newPreviewObject.fixed[selection.objectID()] = {direction:direction,main:decodeURIComponent(encodeURIComponent(selection.objectID())),vs:decodeURIComponent(encodeURIComponent(importedSVGLayer.objectID()))};;
		NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(newPreviewObject),previewKey+context.document.currentPage().objectID());
		context.command.setValue_forKey_onLayer_forPluginIdentifier(importedSVGLayer.objectID(), "fixedMain", importedSVGLayer, previewKey+context.document.currentPage().objectID());
		connectionsGroup.moveToLayer_beforeLayer(context.document.currentPage(),context.document.currentPage());
		buildPreview(context);
	}
}

var setBacks = function(context){
	var setBack_ = function(context,selection){
		var newPreviewObject = getCurrentPagesObject(context);
		newPreviewObject.back[selection.objectID()] = {main:decodeURIComponent(encodeURIComponent(selection.objectID()))};
		NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(newPreviewObject),previewKey+context.document.currentPage().objectID());
		context.command.setValue_forKey_onLayer_forPluginIdentifier(importedSVGLayer.objectID(), "backMain", importedSVGLayer, previewKey+context.document.currentPage().objectID());
	}
	var fx = 0;
	function chooseDialog(n){
		var settingsWindow = COSAlertWindow.new();
		settingsWindow.addButtonWithTitle('确定');
		settingsWindow.addButtonWithTitle('取消');
		settingsWindow.setMessageText('页面中有 '+n+' 个和你设置相同的同名元素，是否都设置为 back？');
		return settingsWindow.runModal();
	}
	if(context.selection.length==0){
		return NSApp.displayDialog('请选中元素进行设置');
	}else{
		var selection = context.selection[0];
		if(selection.className() == 'MSArtboardGroup'){
			return NSApp.displayDialog('请选中元素进行设置');
		}
		var lengthD = 0;
		for(var i = 0;i < context.document.currentPage().children().length;i++){
			if(encodeURIComponent(context.document.currentPage().children()[i].name()) == encodeURIComponent(selection.name())){
				lengthD ++;
			}
		}
		if(lengthD != 1 && chooseDialog(lengthD) != '1000'){
			setBack_(context,selection);
		}else{
			for(var i = 0;i < context.document.currentPage().children().length;i++){
				if(encodeURIComponent(context.document.currentPage().children()[i].name()) == encodeURIComponent(selection.name())){
					setBack_(context,context.document.currentPage().children()[i]);
				}
			}
		}
	}
	buildPreview(context);
}

var clearPreview = function(context){
	var newPreviewObject = getCurrentPagesObject(context);
	for(var i in newPreviewObject){
		for(var k in newPreviewObject[i]){
			for(var l = 0;l < context.selection.length;l++){
				if(k == context.selection[l].objectID()){
					var linkLayersPredicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo, 'valueForKeyPath:', %@)."+ i +" == '"+ newPreviewObject[i][k].vs +"'", previewKey+context.document.currentPage().objectID());
					var oldDialog = context.document.currentPage().children().filteredArrayUsingPredicate(linkLayersPredicate).firstObject();
					if(oldDialog){
						oldDialog.removeFromParent();
						delete newPreviewObject[i][k];
						context.command.setValue_forKey_onLayer_forPluginIdentifier(nil, i, context.selection[l], previewKey+context.document.currentPage().objectID());
						NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(newPreviewObject),previewKey+context.document.currentPage().objectID());

					}
				}
			}
		}
	}
}

var buildPreview = function(context){
	var rx = selection.rect().size.width/414;
	var newPreviewObject = getCurrentPagesObject(context);
	var buildLayers = [];
	if(newPreviewObject.fixed){
		for(var i in newPreviewObject.fixed){

			var x = selection.absoluteRect().x();
			var y = selection.absoluteRect().y();
			// 删除页面中所有
			var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="418" height="219" viewBox="0 0 418 219" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><rect id="rectangle-2-a" width="417.282" height="218.764" x="160" y="252"/></defs><g fill="none" fill-rule="evenodd" transform="translate(-160 -252)"><use fill="#FFFAAC" fill-opacity=".354" xlink:href="#rectangle-2-a"/><rect width="416.282" height="217.764" x="160.5" y="252.5" stroke="#F3E31A"/></g></svg>';
			svg = NSString.stringWithString(svg);
			svg = [svg dataUsingEncoding: NSUTF8StringEncoding];
			var svgImporter = MSSVGImporter.svgImporter();
			svgImporter.prepareToImportFromData(svg);
			var importedSVGLayer = svgImporter.importAsLayer();
			var svgFrame = importedSVGLayer.frame();
			var fixedKey = '#_*fixed__';
			fixedKey = fixedKey + newPreviewObject.fixed[i].direction + '#';

			importedSVGLayer.name = fixedKey + selection.objectID();
			[svgFrame setX:x];
			[svgFrame setY:y];
	        [svgFrame setWidth:selection.rect().size.width];
	        [svgFrame setHeight:selection.rect().size.height];
			buildLayers.push(importedSVGLayer);
	    }
	}
	if(newPreviewObject.back){
		for(var i in newPreviewObject.back){
			var linkLayersPredicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo, 'valueForKeyPath:', %@).backMain == '"+ newPreviewObject.back[i].main +"'", previewKey+context.document.currentPage().objectID());
			var oldBack = context.document.currentPage().children().filteredArrayUsingPredicate(linkLayersPredicate).firstObject();

			var x = oldBack.absoluteRect().x();
			var y = oldBack.absoluteRect().y();
			var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><rect id="rectangle-4-a" width="132.777" height="85.05" x="1" y="117" rx="10"/></defs><g fill="none" fill-rule="evenodd" transform="translate(-1 -117)"><use fill="#FF7979" fill-opacity=".3" xlink:href="#rectangle-4-a"/><rect width="131.777" height="84.05" x="1.5" y="117.5" stroke="#FF7C82" rx="10"/></g></svg>';
			svg = NSString.stringWithString(svg);
			svg = [svg dataUsingEncoding: NSUTF8StringEncoding];
			var svgImporter = MSSVGImporter.svgImporter();
			svgImporter.prepareToImportFromData(svg);
			var importedSVGLayer = svgImporter.importAsLayer();
			var svgFrame = importedSVGLayer.frame();
			var backKey = '#_*back__#';
			importedSVGLayer.name = backKey + oldBack.objectID();
			[svgFrame setX:x];
			[svgFrame setY:y];
		    [svgFrame setWidth:oldBack.rect().size.width];
		    [svgFrame setHeight:oldBack.rect().size.height];
			newPreviewObject.dialog[oldBack.objectID()].vs = decodeURIComponent(encodeURIComponent(importedSVGLayer.objectID()));
			buildLayers.push(importedSVGLayer);
		}
	}
	if(newPreviewObject.dialog){
		for(var i in newPreviewObject.dialog){
			var linkLayersPredicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo, 'valueForKeyPath:', %@).dialogMain == '"+ newPreviewObject.dialog[i].main +"'", previewKey+context.document.currentPage().objectID());
			var oldDailog = context.document.currentPage().children().filteredArrayUsingPredicate(linkLayersPredicate);

			var width = 39 * rx;
			var height = 39 * rx;
			var x = oldDailog.absoluteRect().x() + oldDailog.rect().size.width - width;
			var y = oldDailog.absoluteRect().y() - height;
			// 删除页面中所有
			var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="39" height="39" viewBox="0 0 39 39"><g fill="none"><path fill="#9BABBD" d="M0.812234279,39 L31.1877657,39 C31.6365252,39 32,38.6344946 32,38.1877657 L32,31.647611 L30.3755314,31.647611 L30.3755314,37.3755314 L1.62243797,37.3755314 L1.62243797,8.62446856 L6.8713381,8.62446856 C6.86891724,7.54148952 6.86891724,7 6.8713381,7 L0.812234279,7 C0.36347484,7 0,7.36550543 0,7.81223428 L0,38.1877657 C2.25440299e-16,38.6344946 0.36347484,39 0.812234279,39 Z"/><path fill="#387FD2" d="M32.7130911,7.00001409 L34.8523116,4.86079105 C35.0492295,4.663873 35.0492295,4.34460659 34.8523116,4.14771671 C34.6553938,3.95079866 34.3361559,3.95079866 34.1392381,4.14771671 L31.9999894,6.28696791 L29.8607407,4.14768854 C29.6638229,3.95077049 29.3445851,3.95077049 29.1476672,4.14768854 C28.9507776,4.34460659 28.9507776,4.663873 29.1476672,4.86076288 L31.2869159,6.99998591 L29.1476672,9.13923712 C28.9507776,9.33615517 28.9507776,9.65542158 29.1476672,9.85231146 C29.3445851,10.0492295 29.6638229,10.0492295 29.8607407,9.85231146 L31.9999894,7.71306026 L34.1392381,9.85231146 C34.3361278,10.0492295 34.6553938,10.0492295 34.8523116,9.85231146 C35.0492295,9.65539341 35.0492295,9.33615517 34.8523116,9.13923712 L32.7130911,7.00001409 Z"/><path fill="#387FD2" d="M7.81223428,32 L38.1877657,32 C38.6365252,32 39,31.6344946 39,31.1877657 L39,0.812234279 C39,0.36347484 38.6365252,0 38.1877657,0 L7.81223428,0 C7.36347484,0 7,0.365505425 7,0.812234279 L7,31.1877657 C7,31.6344946 7.36347484,32 7.81223428,32 Z M8.62243797,1.62446856 L37.3755314,1.62446856 L37.3755314,30.3735009 L8.62243797,30.3735009 L8.62243797,1.62446856 Z"/></g></svg>';
			svg = NSString.stringWithString(svg);
			svg = [svg dataUsingEncoding: NSUTF8StringEncoding];
			var svgImporter = MSSVGImporter.svgImporter();
			svgImporter.prepareToImportFromData(svg);
			var importedSVGLayer = svgImporter.importAsLayer();
			var svgFrame = importedSVGLayer.frame();
			var dialogKey = '#_*dialog__';
			importedSVGLayer.name = dialogKey + newPreviewObject.dialog[i].direction + oldDailog.objectID();
			[svgFrame setX:x];
			[svgFrame setY:y];
			[svgFrame setWidth:width];
			[svgFrame setHeight:height];
			newPreviewObject.dialog[oldDailog.objectID()].vs = decodeURIComponent(encodeURIComponent(importedSVGLayer.objectID()));
			buildLayers.push(importedSVGLayer);
		}
		
		
	}
	if(newPreviewObject.index){
		for(var i in newPreviewObject.index){
			var commonPreviewIndexKey = '#_*index__#';

			var width = 97 * rx;
			var height = 97 * rx;
			var linkLayersPredicate = NSPredicate.predicateWithFormat("userInfo != nil && function(userInfo, 'valueForKeyPath:', %@).indexMain == '"+ newPreviewObject.index[i].main +"'", previewKey+context.document.currentPage().objectID());
			var oldIndex = context.document.currentPage().children().filteredArrayUsingPredicate(linkLayersPredicate).firstObject();

			var x = oldIndex.absoluteRect().x() - width;
			var y = oldIndex.absoluteRect().y() - height + 100;
			// 删除页面中所有
			var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="97" height="97" viewBox="0 0 97 97"><defs><linearGradient id="group-a" x1="50%" x2="50%" y1="100%" y2="36.603%"><stop offset="0%" stop-color="#5998E0" stop-opacity="0"/><stop offset="30.973%" stop-color="#5998E0" stop-opacity=".519"/><stop offset="100%" stop-color="#5998E0"/></linearGradient></defs><g fill="none" fill-rule="evenodd" transform="translate(-2 -31)"><g fill-rule="nonzero" transform="rotate(45 23.396 58.338)"><path fill="#5998E0" d="M66.509544,23.521668 C66.0610101,23.521668 65.698452,23.1582988 65.698452,22.710576 L65.698452,0.811092 C65.698452,0.363369216 66.0610101,0 66.509544,0 C66.9580779,0 67.320636,0.363369216 67.320636,0.811092 L67.320636,22.710576 C67.320636,23.1582988 66.9580779,23.521668 66.509544,23.521668 Z"/><path fill="#5998E0" d="M66.509544,1.622184 L44.61006,1.622184 C44.1615261,1.622184 43.798968,1.25881478 43.798968,0.811092 C43.798968,0.363369216 44.1615261,0 44.61006,0 L66.509544,0 C66.9580779,0 67.320636,0.363369216 67.320636,0.811092 C67.320636,1.25881478 66.9580779,1.622184 66.509544,1.622184 Z"/><path fill="url(#group-a)" d="M0.760529288,65.4132226 L65.9361019,0.237649956 C66.2532389,-0.079487016 66.7658491,-0.079487016 67.082986,0.237649956 C67.400123,0.554786928 67.400123,1.06739707 67.082986,1.38453404 L1.90741338,66.5601067 L0.760529288,65.4132226 Z"/></g><text fill="#5998E0" font-family="PingFangSC-Regular, PingFang SC" font-size="12"><tspan x="14" y="41">Start</tspan></text></g></svg>';
			svg = NSString.stringWithString(svg);
			svg = [svg dataUsingEncoding: NSUTF8StringEncoding];
			var svgImporter = MSSVGImporter.svgImporter();
			svgImporter.prepareToImportFromData(svg);
			var importedSVGLayer = svgImporter.importAsLayer();
			var svgFrame = importedSVGLayer.frame();
			importedSVGLayer.name = commonPreviewIndexKey + oldIndex.objectID();
			[svgFrame setX:x];
			[svgFrame setY:y];
			[svgFrame setWidth:width];
			[svgFrame setHeight:height];
			newPreviewObject.index[i].vs = decodeURIComponent(encodeURIComponent(importedSVGLayer.objectID()));
			buildLayers.push(importedSVGLayer);
		}
	}
	var connectionsGroup = getConnectionsInPage(context.document.currentPage());
    if (connectionsGroup) {
    	connectionsGroup.removeFromParent();
    }
	var connectionLayers = MSLayerArray.arrayWithLayers(buildLayers);
	connectionsGroup = MSLayerGroup.groupFromLayers(connectionLayers);
	connectionsGroup.setName("Preview");
	connectionsGroup.setIsLocked(1);
	connectionsGroup.moveToLayer_beforeLayer(context.document.currentPage(),context.document.currentPage());
	context.command.setValue_forKey_onLayer_forPluginIdentifier(true, "isConnectionsContainer", connectionsGroup, previewWrapKey);
}

var hidePreview = function(context){
	var connectionsGroup = getConnectionsInPage(context.document.currentPage());
    if (connectionsGroup) {
    	connectionsGroup.setIsVisible(false);
    }
}

var showPreview = function(context){
	var connectionsGroup = getConnectionsInPage(context.document.currentPage());
    if (connectionsGroup) {
    	connectionsGroup.setIsVisible(true);
    }
}