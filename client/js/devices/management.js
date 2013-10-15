var selectbox = '<select name="featureList" id="featureList" class="dropdownimage" style="width:300px">';
selectbox +=										'<option value="">-- Select an operation to Apply --</option>';
selectbox +=											"{{#data.features}}{{#compare feature_type 'OPERATION'}}";
selectbox +=											'<option value="{{name}}" data-image="https://localhost:9443/mdm/themes/wso2sinine/img/features/{{name}}.png">{{description}}</option>';
selectbox +=											'{{/compare}}{{/data.features}}';
selectbox +=											'</select>';


oTable = $('#main-table').dataTable({
	
			
	
		"sDom" : "<'row-fluid'<'span6'><'span6'p>r>t<'row-fluid'>",
		"bProcessing" : true,
		"bServerSide" : true,
		"bFilter" : false,
		
		aoColumns: [
                      
                      null,
                      null,

                      {                         
                        "fnRender": function (oObj)                              
                        {                           
                            return "<a href='/mdm/users/devices?user="  + oObj.aData[2] + "'>"+  oObj.aData[2] +"</a>";
                        }
                      },
                      
                       null,
                       null,
                       null,
                       

                   ],	
		"sAjaxSource" : "/mdm/api/webconsole/listDevices?",
		"fnServerParams": function ( aoData ) {
          	var roles = $('#inputRoles').val();
			var user = $('#inputUser').val();
			var ownership = $('#inputOwnership').val();
			var os = $('#inputOS').val();
			
            aoData.push( { "name": "role", "value": roles } );
            aoData.push( { "name": "username", "value": user } );
            aoData.push( { "name": "byod", "value": ownership } );
            aoData.push( { "name": "platform_id", "value": os } );
        }
		
	});
	

	



jQuery.ajax({
					url : getServiceURLs("groupsCRUD", ""),
					type : "GET",
					async : "false",					
					contentType : "application/json",
					dataType : "json",
					success : function(roles) {
						
						/*					 $('#inputRoles')
					        .textext({
					            plugins : 'autocomplete tags filter'
					        })
					        .bind('getSuggestions', function(e, data)
					        {            
					            var list = roles,
					                textext = $(e.target).textext()[0],
					                query = (data ? data.query : '') || ''
					                ;
					
					            $(this).trigger(
					                'setSuggestions',
					                { result : textext.itemManager().filter(list, query) }
					            );
					        });*/
						
						
					}					

});






$("#btn-find").click(function() {
	oTable.fnDraw();
});


$( "#featureList" ).change(function() {
	
	
	var roles = $('#inputRoles').val();
	var user = $('#inputUser').val();
	var ownership = $('#inputOwnership').val();
	var os = $('#inputOS').val();
	
	var operation = $(this).val();
	var operationText = this.options[this.selectedIndex].innerHTML;
	
	var nFiltered = oTable.fnGetData();
	
	var devices = new Array();
	
	for(var i = 0; i < nFiltered.length; i++){		
		if (isNaN(nFiltered[i][0]) == false){
			devices.push(nFiltered[i][0].toString() );
			
		}
	}
	
	if(devices.length == 0){
		noty({
					text : 'No devices selected',
					'layout' : 'center',
					'modal': false,
					'type': 'error'
					
		});
		return;
	}
			
	
	noty({
		text : 'Are you sure you want to perform "'+operationText+'" operation on selected devices? ' + devices.length + " devices will be affected.",
		buttons : [{
			addClass : 'btn btn-cancel',
			text : 'Cancel',
			onClick : function($noty) {
				$noty.close();
				$('#featureList').msDropDown().data('dd').setIndexByValue("");		
			}
			
			
		}, {
			
			addClass : 'btn btn-orange',
			text : 'Ok',
			onClick : function($noty) {

				jQuery.ajax({
					url : getServiceURLs("performDevicesOperation", operation),
					type : "POST",
					async : "false",
					data : JSON.stringify({operation: operation, devices:devices, roles: roles, user: user, ownership: ownership, os:os}),
					contentType : "application/json",
					dataType : "json"					

				});

				noty({
					text : 'Operation is sent to the devices successfully!',
					'layout' : 'center',
					'modal': false
					
				});

				$noty.close();
				$('#featureList').msDropDown().data('dd').setIndexByValue("");		

			}
			
		}]
	});
	
	
	
	
	
	
	
	
	
});

