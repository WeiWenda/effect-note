/**
 * Sample plugin.
 */
Draw.loadPlugin(function(ui) {
	
	// Sidebar is null in lightbox
	if (ui.sidebar != null)
	{
	    // Adds custom sidebar entry
	    ui.sidebar.addPalette('esolia', 'eSolia', true, function(content) {
	
	        // content.appendChild(ui.sidebar.createVertexTemplate(null, 120, 60));
	        content.appendChild(ui.sidebar.createVertexTemplate('shape=image;image=http://download.esolia.net.s3.amazonaws.com/img/eSolia-Logo-Color.svg;resizable=0;movable=0;rotatable=0', 100, 100));
	        content.appendChild(ui.sidebar.createVertexTemplate('text;spacingTop=-5;fontFamily=Courier New;fontSize=8;fontColor=#999999;resizable=0;movable=0;rotatable=0', 100, 100));
	        content.appendChild(ui.sidebar.createVertexTemplate('rounded=1;whiteSpace=wrap;gradientColor=none;fillColor=#004C99;shadow=1;strokeColor=#FFFFFF;align=center;fontColor=#FFFFFF;strokeWidth=3;fontFamily=Courier New;verticalAlign=middle', 100, 100));
	        content.appendChild(ui.sidebar.createVertexTemplate('curved=1;strokeColor=#004C99;endArrow=oval;endFill=0;strokeWidth=3;shadow=1;dashed=1', 100, 100));
	    });
	
	    // Collapses default sidebar entry and inserts this before
	    var c = ui.sidebar.container;
	    c.firstChild.click();
	    c.insertBefore(c.lastChild, c.firstChild);
	    c.insertBefore(c.lastChild, c.firstChild);
	
	    // Adds logo to footer
	    ui.footerContainer.innerHTML = '<img width=50px height=17px align="right" style="margin-top:14px;margin-right:12px;" ' + 'src="http://download.esolia.net.s3.amazonaws.com/img/eSolia-Logo-Color.svg"/>';
		
		// Adds placeholder for %today% and %filename%
	    var graph = ui.editor.graph;
		var graphGetGlobalVariable = graph.getGlobalVariable;
		
		graph.getGlobalVariable = function(name)
		{
			if (name == 'today')
			{
				return new Date().toLocaleString();
			}
			else if (name == 'filename')
			{
				var file = ui.getCurrentFile();
				
				return (file != null && file.getTitle() != null) ? file.getTitle() : '';
			}
			
			return graphGetGlobalVariable.apply(this, arguments);
		};
		
		// Adds support for exporting PDF with placeholders
		var graphGetExportVariables = graph.getExportVariables;
		
		Graph.prototype.getExportVariables = function()
		{
			var vars = graphGetExportVariables.apply(this, arguments);
			var file = ui.getCurrentFile();
			
			vars['today'] = new Date().toLocaleString();
			vars['filename'] = (file != null && file.getTitle() != null) ? file.getTitle() : '';
			
			return vars;
		};
	
//	    // Adds resource for action
//	    mxResources.parse('helloWorldAction=Hello, World!');
//	
//	    // Adds action
//	    ui.actions.addAction('helloWorldAction', function() {
//	        var ran = Math.floor((Math.random() * 100) + 1);
//	        mxUtils.alert('A random number is ' + ran);
//	    });
//	
//	    // Adds menu
//	    ui.menubar.addMenu('Hello, World Menu', function(menu, parent) {
//	        ui.menus.addMenuItem(menu, 'helloWorldAction');
//	    });
//	
//	    // Reorders menubar
//	    ui.menubar.container.insertBefore(ui.menubar.container.lastChild,
//	        ui.menubar.container.lastChild.previousSibling.previousSibling);
//	
//	    // Adds toolbar button
//	    ui.toolbar.addSeparator();
//	    var elt = ui.toolbar.addItem('', 'helloWorldAction');
//	
//	    // Cannot use built-in sprites
//	    elt.firstChild.style.backgroundImage = 'url(https://www.draw.io/images/logo-small.gif)';
//	    elt.firstChild.style.backgroundPosition = '2px 3px';
	}
});