oTable = $('#main-table').dataTable({
		"sDom" : "<'row-fluid'<'tabel-filter-group span8'T><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
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

                   ],	
		"sAjaxSource" : "/mdm/config/test/dummy_devices.json?",
		"fnServerParams": function ( aoData ) {
          	var roles = $('#inputRoles').val();
			var user = $('#inputUser').val();
			var ownership = $('#inputOwnership').val();
			var os = $('#inputOS').val();
			
            aoData.push( { "name": "role", "value": roles } );
            aoData.push( { "name": "user", "value": user } );
            aoData.push( { "name": "ownership", "value": ownership } );
            aoData.push( { "name": "os", "value": os } );
        }
		
	});



jQuery.ajax({
					url : getServiceURLs("groupsCRUD", ""),
					type : "GET",
					async : "false",					
					contentType : "application/json",
					dataType : "json",
					success : function(roles) {
						
											 $('#inputRoles')
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
					        });

						
						
						
						
						
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
			devices.push(nFiltered[i][0]);
			
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
					url : getServiceURLs("performGroupsOperation"),
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

