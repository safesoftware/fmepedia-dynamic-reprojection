var map;

/**
 * LatLngControl class displays the LatLng and pixel coordinates
 * underneath the mouse within a container anchored to it.
 * @param {google.maps.Map} map Map to add custom control to.
 */
function LatLngControl(map){
    /**
     * Offset the control container from the mouse by this amount.
     */
    this.ANCHOR_OFFSET_ = new google.maps.Point(8, 8);
    
    /**
     * Pointer to the HTML container.
     */
    this.node_ = this.createHtmlNode_();
    
    // Add control to the map. Position is irrelevant.
    map.controls[google.maps.ControlPosition.TOP].push(this.node_);
    
    // Bind this OverlayView to the map so we can access MapCanvasProjection
    // to convert LatLng to Point coordinates.
    this.setMap(map);
    
    // Register an MVC property to indicate whether this custom control
    // is visible or hidden. Initially hide control until mouse is over map.
    this.set('visible', false);
}

// Extend OverlayView so we can access MapCanvasProjection.
LatLngControl.prototype = new google.maps.OverlayView();
LatLngControl.prototype.draw = function(){};

/**
 * @private
 * Helper function creates the HTML node which is the control container.
 * @return {HTMLDivElement}
 */
LatLngControl.prototype.createHtmlNode_ = function(){
    var divNode = document.createElement('div');
    divNode.id = 'latlng-control';
    divNode.index = 100;
    return divNode;
};

/**
 * MVC property's state change handler function to show/hide the
 * control container.
 */
LatLngControl.prototype.visible_changed = function(){
    this.node_.style.display = this.get('visible') ? '' : 'none';
};

/**
 * Specified LatLng value is used to calculate pixel coordinates and
 * update the control display. Container is also repositioned.
 * @param {google.maps.LatLng} latLng Position to display
 */
LatLngControl.prototype.updatePosition = function(latLng){
    var projection = this.getProjection();
    var point = projection.fromLatLngToContainerPixel(latLng);
    
    // Update control position to be anchored next to mouse position.
    this.node_.style.left = point.x + this.ANCHOR_OFFSET_.x + 'px';
    this.node_.style.top = point.y + this.ANCHOR_OFFSET_.y + 'px';
    
    // Update control to display latlng and coordinates.
    this.node_.innerHTML = [latLng.toUrlValue(4), '<br/>', point.x, 'px, ', point.y, 'px'].join('');
};

/**
 * Sends a call to FME Server when the user clicks on the map.
 * @param  Obj latLngObj Object containing the latitude and longitude
 */
function runWorkspaceJavascript(latLngObj){

    /*
     Commonly available on the web, this function was taken from:
     http://ajaxpatterns.org/XMLHttpRequest_Call
     */
    function createXMLHttpRequest(){
        try {
            return new XMLHttpRequest();
        } 
        catch (e) {
        }
        try {
            return new ActiveXObject("Msxml2.XMLHTTP");
        } 
        catch (e) {
        }
        alert("XMLHttpRequest not supported");
        return null;
    }
    /*
     Display the result when complete
     */
    function onResponse(inObj){
        // 4 indicates a result is ready  
        if (xhReq.readyState != 4) 
            return;
        // Get the response and display it
        alert(xhReq.responseText);
        
        return;
    }
    /*
     Create the XMLHttpRequest object
     */
    var xhReq = createXMLHttpRequest();
    // Request Variables
    pHostName = "https://fmepedia2014-safe-software.fmecloud.com"
    pUrlBase = pHostName+"/fmedatastreaming/Demos/000002007_reprojection_demo.fmw"
    pHttpMethod = "GET"
    // Create REST call
    pRestCall = pUrlBase + "?token=8be243c0fc2f5f34977050bdab57ebbdd3e72aa2";
    pRestCall = pRestCall + "&YVALATTR="+ latLngObj.lat();
    pRestCall = pRestCall + "&XVALATTR="+ latLngObj.lng();

    pRestCall += "&COORDSYS=" + document.fmeForm.elements[0].value;

    // Send request
    xhReq.open(pHttpMethod, pRestCall, true);
    xhReq.onreadystatechange = onResponse;
    xhReq.send();
}

/**
 * Called on the intial pageload.
 */
function init(){
    var centerLatLng = new google.maps.LatLng(30.3169444, -97.7427778);
    map = new google.maps.Map(document.getElementById('map'), {
        'zoom': 12,
        'center': centerLatLng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
    });
    
    // Create new control to display latlng and coordinates under mouse.
    latLngControl = new LatLngControl(map);
    
    // Register event listeners
    google.maps.event.addListener(map, 'mouseover', function(mEvent){
        latLngControl.set('visible', true);
    });
    google.maps.event.addListener(map, 'mouseout', function(mEvent){
        latLngControl.set('visible', false);
    });
    google.maps.event.addListener(map, 'mousemove', function(mEvent){
        latLngControl.updatePosition(mEvent.latLng);
    });
    google.maps.event.addListener(map, 'click', function(mEvent){
    
    
        var marker = new google.maps.Marker({
            position: mEvent.latLng,
            map: map,
            title: "Hello World!"
        });
        
        runWorkspaceJavascript(mEvent.latLng);
        
    });

    //---- Initiate FME Server Objects ----//

    FMEServer.init({
        server : "https://fmepedia2014-safe-software.fmecloud.com",
        token : "8be243c0fc2f5f34977050bdab57ebbdd3e72aa2"
    });

    FMEServer.getWorkspaceParameter('Demos', '000002007_reprojection_demo.fmw', 'COORDSYS', generateForm);

    function generateForm( json ) {
        var form = document.getElementById( "fmeForm" );

        // Build the form items using the API
        FMEServer.generateFormItem( "fmeForm", json );
    }
    
}

// Register an event listener to fire when the page finishes loading.
google.maps.event.addDomListener(window, 'load', init);
