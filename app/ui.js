

$(function () {
    var pstyle = 'background-color: #fff; border: 1px solid #dfdfdf; padding: 0px;';
    var pstyleHidden = 'background-color: #fff; border: 1px solid #dfdfdf; padding: 0px; overflow:hidden;';

    var layout = document.createElement('div');
    layout.id = 'layout';
    document.body.appendChild(layout);

    $('#layout').w2layout({
        name: 'layout',
        panels: [
            {
                type: 'top', size: 30, resizable: false, style: pstyle + 'border-top: 0px;',
                toolbar: {
                    name: 'toolbar',
                    items: [
						{ type: 'button', id: 'item3', caption: '', img: 'icon-captureview', checked: false, hint: 'Click to save screenshot' },
						{ type: 'button', id: 'item4', caption: '', img: 'icon-zoomextents', checked: false, hint: 'Click to zoom the camera to the scene extents' },
						{ type: 'button', id: 'item5', caption: '', img: 'icon-zoomselected', checked: false, hint: 'Click to zoom the camera to the selected object' },
						{ type: 'spacer' },
                        { type: 'check', id: 'item1', caption: 'Layers', img: 'icon-layers', checked: false, hint: 'Open sidebar to reveal Layers' },
						{ type: 'check', id: 'item2', caption: 'Views', img: 'icon-views', checked: false, hint: 'Open sidebar to reveal Views' }
                    ],
                    onClick: function (event) {
                        this.owner.content('main', event);
                     
                        switch (event.item.id) {
                            case 'item1':

                                if (!event.item.checked && !w2ui['layout'].panels[0].toolbar.items[5].checked) {

                                    w2ui['layout'].sizeTo('right', window.innerWidth * .1);
                                    w2ui['layout'].toggle('right', window.instant);
                                    w2ui['layout2'].set('left', { hidden: false });

                                }
                                if (event.item.checked && w2ui['layout'].panels[0].toolbar.items[5].checked) {
                                    w2ui['layout2'].set('left', { hidden: true });
                                    w2ui['layout'].sizeTo('right', window.innerWidth * .1);

                                }
                                if (!event.item.checked && w2ui['layout'].panels[0].toolbar.items[5].checked) {

                                    w2ui['layout'].sizeTo('right', window.innerWidth * .2);
                                    w2ui['layout2'].set('left', { hidden: false });

                                }
                                if (event.item.checked && !w2ui['layout'].panels[0].toolbar.items[5].checked) {
                                    w2ui['layout2'].set('left', { hidden: true });
                                    w2ui['layout'].toggle('right', window.instant);

                                }

                                break;

                            case 'item2':


                                if (!event.item.checked && !w2ui['layout'].panels[0].toolbar.items[4].checked) {

                                    w2ui['layout'].sizeTo('right', window.innerWidth * .1);
                                    w2ui['layout'].toggle('right', window.instant);
                                    w2ui['layout2'].set('right', { hidden: false });

                                }
                                if (event.item.checked && w2ui['layout'].panels[0].toolbar.items[4].checked) {
                                    w2ui['layout2'].set('right', { hidden: true });
                                    w2ui['layout'].sizeTo('right', window.innerWidth * .1);

                                }
                                if (!event.item.checked && w2ui['layout'].panels[0].toolbar.items[4].checked) {

                                    w2ui['layout'].sizeTo('right', window.innerWidth * .2);
                                    w2ui['layout2'].set('right', { hidden: false });

                                }
                                if (event.item.checked && !w2ui['layout'].panels[0].toolbar.items[4].checked) {
                                    w2ui['layout2'].set('right', { hidden: true });
                                    w2ui['layout'].toggle('right', window.instant);

                                }

                                break;

                            case 'item3':

                                //do screenshot
                                window.dispatchEvent(new CustomEvent('viewCapture'));

                                break;

                            case 'item4':

                                //do zoom extents
                                window.dispatchEvent(new CustomEvent('zoomExtents'));

                                break;

                            case 'item5':

                                //do zoom selected
                                window.dispatchEvent(new CustomEvent('zoomSelected'));

                                break;
                        }
                    }
                }
            },
            //{ type: 'main', style: pstyle, content: ' <iframe src="index.html" frameborder="0"></iframe> '},
			{ type: 'main', style: pstyleHidden, content: ' <div id="content" style="overflow:hidden;"></div> ' },
            { type: 'right', size: '20%', resizable: true, hidden: true, style: pstyle, content: '' },
            { type: 'bottom', size: 50, resizable: false, style: pstyle, content: '<div id="bottom"></div>' }
        ]
    });

    var footer = document.getElementById('footer');
    footer.style.clear = 'none';
    footer.style.height = 'auto';
    footer.style.marginTop = '0px';
    document.getElementById('bottom').appendChild(footer);

    $().w2layout({
        name: 'layout2',
        panels: [
            { type: 'left', size: window.innerWidth * .1, resizable: true, style: pstyle, hidden: true, content: ' <div id="layers"></div> ' },
            { type: 'right', size: window.innerWidth * .1, resizable: true, style: pstyle, hidden: true, content: ' <div id="views"></div> ' }
        ]
    });

    w2ui['layout'].content('right', w2ui['layout2']);

    window.addEventListener('add-layer', onAddLayer);

    function onAddLayer(event) {
        var layer = event.detail.layer

        var divID = event.detail.layer.split(' ').join('_');

        var objTo = document.getElementById('layers');
        var divtest = document.createElement("div");
        divtest.setAttribute("id", divID);
        objTo.appendChild(divtest);

        $(function () {
            $('#' + divID).w2toolbar({
                name: divID,
                items: [

					{ type: 'check', id: 'item1', caption: layer, img: 'icon-on', checked: true }
                ],
                onClick: function (event) {

                    var data = {
                        detail: {
                            layer: event.item.text
                        }
                    }

                    if (event.item.checked) {
                        window.dispatchEvent(new CustomEvent('layerOff', data));
                        w2ui[divID].set(event.target, { img: 'icon-off' });

                    } else {
                        window.dispatchEvent(new CustomEvent('layerOn', data));
                        w2ui[divID].set(event.target, { img: 'icon-on' });

                    }
                },

                onSetState: function (data) {

                    w2ui[data.detail.divID].set(w2ui[data.detail.divID].items[0].id, { img: 'icon-off', checked: false });

                }
            });
        });
    }


    window.addEventListener('add-view', onAddView);

    function onAddView(event) {
        var divID = event.detail.viewID

        var objTo = document.getElementById('views');
        var divtest = document.createElement("div");
        divtest.setAttribute("id", divID);
        objTo.appendChild(divtest);
        var pOn = false;
        var disabled = false;


        $(function () {
            $('#' + divID).w2toolbar({
                name: divID,
                items: [
					{ type: 'check', id: 'item1', caption: event.detail.viewName, img: 'icon-views', checked: false, disabled: false }
                ],
                onClick: function (event) {

                    var data = {
                        detail: {
                            view: event.item.text
                        }
                    }

                    if (!event.item.checked) {

                        var childNodeArray = document.getElementById('views').childNodes;
                        //w2ui[divID].disable('item1');

                        //this is to avoid a double click to reset the view.
                        //if one wants the views to update, this line should be comented out
                        //as it will be helpful to identify which view is current.
                        w2ui[divID].set('item1', { checked: true });

                        for (var i = 0; i < childNodeArray.length; i++) {

                            if (childNodeArray[i].id != event.item.text) {
                                w2ui[childNodeArray[i].id].set('item1', { checked: false });
                                w2ui[childNodeArray[i].id].enable('item1');
                            }
                        }


                        window.dispatchEvent(new CustomEvent('viewChange', data));
                    }


                }
            });
        });

    }


});

