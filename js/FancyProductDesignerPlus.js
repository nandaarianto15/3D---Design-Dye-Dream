/**
 * <strong>This is part of the PLUS add-on.</strong><br>
 * The class to create the Bulk Variations that is related to FancyProductDesigner class.
 * <h5>Example</h5><pre>fpdInstance.bulkVariations.getOrderVariations();</pre>
 * But you can just use the getOrder() method of FancyProductDesigner class, this will also include the order variations object. <pre>fpdInstance.getOrder();</pre>
 *
 * @class FPDBulkVariations
 * @constructor
 * @param {FancyProductDesigner} fpdInstance - An instance of FancyProductDesigner class.
 */
var FPDBulkVariations = function(fpdInstance) {

	'use strict';

	$ = jQuery;

	var instance = this,
		$container = $(fpdInstance.mainOptions.bulkVariationsPlacement).addClass('fpd-bulk-variations fpd-container'),
		variations = fpdInstance.mainOptions.bulkVariations,
		variationRowHtml = '';


	/**
	 * Gets the variation(s) from the UI.
	 *
	 * @method getOrderVariations
	 * @return {Array|Boolean} An array containing objects with variation and quantity properties. If a variation in the UI is not set, it will return false.
	 */
	this.getOrderVariations = function() {

		var variations = [];
		$container.find('.fpd-row').each(function(i, row) {

			var $row = $(row);

			var variation = {};
			$row.children('.fpd-select-col').each(function(i, selectCol) {

				var $select = $(selectCol).find('select');

				if($select.val() == null) {
					variations = false;
					$select.addClass('fpd-error');
				}

				variation[$select.attr('name')] = $select.val();

			});

			if(variations !== false) {
				variations.push({variation: variation, quantity: parseInt($row.find('.fpd-quantity').val()) });
			}


		});

		return variations;
	};

	/**
	 * Loads variation(s) in the UI.
	 *
	 * @method setup
	 * @param {Array} variations An array containing objects with variation and quantity properties.
	 */
	this.setup = function(variations) {

		if(typeof variations === 'object') {

			$container.children('.fpd-variations-list').empty();
			variations.forEach(function(variationItem) {

				$container.children('.fpd-variations-list').append(variationRowHtml);

				var $lastRow = $container.children('.fpd-variations-list').children('.fpd-row:last');

				//Set value of select dropdowns
				Object.keys(variationItem.variation).forEach(function(attribute) {
					$lastRow.find('select[name="'+attribute+'"]').val(variationItem.variation[attribute]);
				});

				$lastRow.find('.fpd-quantity').val(variationItem.quantity);

			});

		}

		_setTotalQuantity();

	};

	var _setTotalQuantity = function() {

		var totalQuantity = 0;
		$container.find('.fpd-quantity').each(function() {
			totalQuantity += Number(this.value);
		});

		fpdInstance.setOrderQuantity(Number(totalQuantity));

	};

	var _initialize = function() {

		//when getOrder is called, add bulk variations
		fpdInstance.$container.on('getOrder', function() {

			fpdInstance._order.bulkVariations = instance.getOrderVariations();

		});

		if(typeof variations === 'object') {

			var keys = Object.keys(variations);

			variationRowHtml += '<div class="fpd-row">';
			for(var i=0; i<keys.length; ++i) {

				var key = keys[i],
					variationAttrs = variations[key];

				variationRowHtml += '<div class="fpd-select-col"><select name="'+key+'"><option value="" disabled selected>'+key+'</option>';

				for(var j=0; j<variationAttrs.length; ++j) {
					variationRowHtml += '<option value="'+variationAttrs[j]+'">'+variationAttrs[j]+'</option>';
				}

				variationRowHtml += '</select></div>';

			}

			variationRowHtml += '<div><input type="number" class="fpd-quantity" step="1" min="1" value="1" /></div>';
			variationRowHtml += '<div class="fpd-remove-row"><span class="fpd-icon-close"></span></div>';
			variationRowHtml += '</div>';

		}

		$container.append('<div class="fpd-variations-list">'+variationRowHtml+'</div>')
		.prepend('<div class="fpd-clearfix"><span class="fpd-title fpd-left">'+fpdInstance.getTranslation('plus', 'bulk_add_variations_title')+'</span><span class="fpd-add-row fpd-btn fpd-right">'+fpdInstance.getTranslation('plus', 'bulk_add_variations_add')+'</span></div>');

		$container.on('click', '.fpd-add-row', function() {
			$container.children('.fpd-variations-list').append(variationRowHtml);
			_setTotalQuantity();
		});

		$container.on('click', '.fpd-remove-row', function() {

			var $thisRow = $(this).parents('.fpd-row:first');
			if($thisRow.siblings('.fpd-row').length > 0) {
				$thisRow.remove();
				_setTotalQuantity();
			}

		});

		$container.on('change', 'select', function() {

			var $this = $(this);

			$this.removeClass('fpd-error');

		});

		$container.on('change', '.fpd-quantity', function() {

			var $this = $(this);

			if( this.value < Number($this.attr('min')) ) {
				this.value = Number($this.attr('min'));
			}
			if(this.value == '') {
				this.value = 1;
			}

			_setTotalQuantity();

		});

		_setTotalQuantity();

	};

	_initialize();

};

var FPDColorSelection = function(fpdInstance) {

	'use strict';

	$ = jQuery;

	var $colorSelectionElem = null,
		colorDragging = false,
		target = fpdInstance.mainOptions.colorSelectionPlacement;

	var _createColorItem = function(element) {

		var $item = $('<div class="fpd-cs-item" data-id="'+element.id+'"><div class="fpd-title">'+element.title+'</div><div class="fpd-colors"></div></div>');

		if(FPDUtil.elementHasColorSelection(element)) {

			$colorSelectionElem.append($item);

			var availableColors = FPDUtil.elementAvailableColors(element, fpdInstance);

			if(element.type == FPDPathGroupName && element.getObjects().length > 1) {  //path-groups

				for(var i=0; i < availableColors.length; ++i) {
					$item.children('.fpd-colors').append('<input type="text" value="'+availableColors[i]+'" />');
				}

				$item.find('.fpd-colors input').spectrum({
					showPaletteOnly: $.isArray(element.colors),
					preferredFormat: "hex",
					showInput: true,
					showInitial: true,
					showButtons: false,
					showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
					palette: $.isArray(element.colors) ? element.colors : fpdInstance.mainOptions.colorPickerPalette,
					show: function(color) {

						var $colors = $(this).parent('.fpd-colors');

						var svgColors = FPDUtil.changePathColor(
							element,
							$colors.children('input').index(this),
							color
						);

						FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);

						element._tempFill = svgColors;

					},
					move: function(color) {

						var $colors = $(this).parent('.fpd-colors');

						var svgColors = FPDUtil.changePathColor(
							element,
							$colors.children('input').index(this),
							color
						);

						fpdInstance.currentViewInstance.changeColor(element, svgColors);

					},
					change: function(color) {

						var $colors = $(this).parent('.fpd-colors');

						var svgColors = FPDUtil.changePathColor(
							element,
							$colors.find('input').index(this),
							color
						);

						$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
						fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

					}
				});


			}
			else if(availableColors != 1 && (availableColors.length > 1 || (element.type == FPDPathGroupName && element.getObjects().length === 1))) { // multiple colors

				var dropdownActive = false;
				if(fpdInstance.mainOptions.colorSelectionDisplayType == 'dropdown' && target.indexOf('inside-') == -1) {

					$item.addClass('fpd-dropdown')
					.children('.fpd-title').append('<span class="fpd-icon-arrow-dropdown"></span>');

					dropdownActive = true;

				}

				for(var i=0; i < availableColors.length; ++i) {

					var color = availableColors[i],
						tooltipTitle = fpdInstance.mainOptions.hexNames[color.replace('#', '').toLowerCase()];

					tooltipTitle = tooltipTitle ? tooltipTitle : color;

					if(typeof color === 'string' && color.length == 4) {
						color += color.substr(1, color.length);
					}

					$item.find('.fpd-colors').append('<div data-color="'+color+'" style="background-color: '+color+'" class="fpd-item fpd-tooltip" title="'+tooltipTitle+'"><div class="fpd-label">'+(dropdownActive ? tooltipTitle : color)+'</div></div>');

					$item.find('.fpd-item:last').click(function() {

						var color = tinycolor($(this).css('backgroundColor'));

						fpdInstance.deselectElement();
						fpdInstance.currentViewInstance.currentUploadZone = null;

						var fillValue = color.toHexString();
						if(element.type == FPDPathGroupName) {

							fillValue = FPDUtil.changePathColor(
								element,
								0,
								color
							);

						}

						fpdInstance.viewInstances[0].setElementParameters(
							{fill: fillValue},
							element
						);

					});

				}

				_renderPatternsList(element, $item.find('.fpd-colors'), dropdownActive);

				FPDUtil.updateTooltip($item);

			}
			else { //color picker

				$item.children('.fpd-colors').append('<input type="text" value="'+element.colors[0]+'" />');
				$item.find('input').spectrum({
					showButtons: false,
					preferredFormat: "hex",
					showInput: true,
					showInitial: true,
					showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
					palette: fpdInstance.mainOptions.colorPickerPalette,
					show: function(color) {

						FPDUtil.spectrumColorNames($(this).spectrum('container'), fpdInstance);
						element._tempFill = color.toHexString();

					},
					move: function(color) {

						//only non-png images are chaning while dragging
						if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
							fpdInstance.viewInstances[0].changeColor(element, color.toHexString());
						}

					},
					change: function(color) {

						$(document).unbind("click.spectrum");
						fpdInstance.viewInstances[0].setElementParameters(
							{fill: color.toHexString()},
							element
						);

					}
				})
				.on('dragstart.spectrum', function() {
					colorDragging = true;
				})
				.on('dragstop.spectrum', function(evt, color) {
					colorDragging = false;
					fpdInstance.viewInstances[0].changeColor(element, color.toHexString());
				});

			}

		}

	};

	var _renderPatternsList = function(element, $wrapper, dropdownActive) {

		if($.isArray(element.patterns) && (FPDUtil.isSVG(element) || FPDUtil.getType(element.type) === 'text')) {

			element.patterns.forEach(function(pattern) {

				var patternTitle = pattern.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, "").replace('_', ' '),
					patternLabel = dropdownActive ? '<div class="fpd-label">'+patternTitle+'</div>' : '';

				$wrapper.append('<div data-pattern="'+pattern+'" style="background-image: url('+pattern+')" class="fpd-item fpd-tooltip fpd-pattern" title="'+patternTitle+'">'+patternLabel+'</div>');

				$wrapper.find('.fpd-item:last').click(function() {

					var pattern = $(this).data('pattern');

					fpdInstance.deselectElement();
					fpdInstance.currentViewInstance.currentUploadZone = null;

					fpdInstance.viewInstances[0].setElementParameters(
						{pattern: pattern},
						element
					);

				});

			})

		}

	};

	var _initialize = function() {

		//update color selection when product is created
		fpdInstance.$container
		.on('productCreate', function() {

			//get all elements in first view for color selection panel
			var csElements = fpdInstance.getElements(0).filter(function(obj) {
				return obj.showInColorSelection;
			});

			//check if instance has views and a first a main element to get the colors from
			if(csElements.length > 0) {

				//create cs wrapper on first product creation
				if($colorSelectionElem == null) {

					//position inside
					if(target.indexOf('inside-') !== -1) {

						$colorSelectionElem = fpdInstance.$mainWrapper.append('<div class="fpd-color-selection fpd-inside-main fpd-clearfix fpd-'+target+'"></div>').children('.fpd-color-selection');
					}
					//position outside
					else {

						$colorSelectionElem = $(target).addClass('fpd-color-selection fpd-clearfix fpd-custom-pos');

					}

				}

				//clear all
				$colorSelectionElem.find('input').spectrum('destroy');
				$colorSelectionElem.empty();

				//only one single element is allowed inside
				if(target.indexOf('inside-') !== -1) {
					csElements = [csElements[0]];
				}

				//create color items
				csElements.forEach(function(element) {
					_createColorItem(element);
				});

				$colorSelectionElem.off().on('click', '.fpd-dropdown > .fpd-title', function() {

					$(this).next('.fpd-colors').toggleClass('fpd-active')
					.parent('.fpd-dropdown').siblings('.fpd-dropdown').children('.fpd-colors').removeClass('fpd-active');

				});

				$colorSelectionElem.show();

			}
			else if($colorSelectionElem) {
				$colorSelectionElem.hide();
			}

		})
		.on('elementRemove', function(evt, element) {

			if(element.showInColorSelection) {
				$colorSelectionElem.children('[data-id="'+element.id+'"]')
				.find('input').spectrum('destroy')
				.remove();
			}

		})
		.on('elementColorChange', function(evt, element, hex) {

			if($colorSelectionElem && typeof hex === 'string') {

				$colorSelectionElem.children('[data-id="'+element.id+'"]').find('.fpd-colors > [data-color="'+hex+'"]')
				.addClass('fpd-active').siblings().removeClass('fpd-active');

			}

		})

	};

	_initialize();
};

var FPDDrawingModule = function(fpdInstance, $module) {

	'use strict';

	$ = jQuery;

	this.drawCanvas = null;

	var instance = this,
		currentLineColor = '#000000',
		currentBrushType = 'Pencil';

	var _getCustomBrush = function(canvas, type) {

		if(type === 'vLine') {

			var vLinePatternBrush = new fabric.PatternBrush(canvas);
		    vLinePatternBrush.getPatternSrc = function() {

		      var patternCanvas = fabric.document.createElement('canvas');
		      patternCanvas.width = patternCanvas.height = 10;
		      var ctx = patternCanvas.getContext('2d');

		      ctx.strokeStyle = this.color;
		      ctx.lineWidth = 5;
		      ctx.beginPath();
		      ctx.moveTo(0, 5);
		      ctx.lineTo(10, 5);
		      ctx.closePath();
		      ctx.stroke();

		      return patternCanvas;
		    };

			return vLinePatternBrush;
		}
		else if(type === 'hLine') {

			var hLinePatternBrush = new fabric.PatternBrush(canvas);
		    hLinePatternBrush.getPatternSrc = function() {

		      var patternCanvas = fabric.document.createElement('canvas');
		      patternCanvas.width = patternCanvas.height = 10;
		      var ctx = patternCanvas.getContext('2d');

		      ctx.strokeStyle = this.color;
		      ctx.lineWidth = 5;
		      ctx.beginPath();
		      ctx.moveTo(5, 0);
		      ctx.lineTo(5, 10);
		      ctx.closePath();
		      ctx.stroke();

		      return patternCanvas;
		    };

		    return hLinePatternBrush;

		}

	};

	var _initialize = function() {

		$module.find('.fpd-drawing-brush-type .fpd-item').click(function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$current = $this.parent().prevAll('.fpd-dropdown-current:first'),
				value = $this.data('value');

			$current.html($this.clone()).data('value', value);
			currentBrushType = value;

			instance.drawCanvas.freeDrawingBrush = _getFabricBrush(value);

			if (instance.drawCanvas.freeDrawingBrush) {
			    instance.drawCanvas.freeDrawingBrush.color = currentLineColor;
				instance.drawCanvas.freeDrawingBrush.width = $module.find('.fpd-drawing-line-width').val();
		    }

		    $this.parents('.fpd-dropdown:first').removeClass('fpd-active');

		});

		$module.find('.fpd-drawing-line-color').spectrum({
			color: currentLineColor,
			showButtons: false,
			preferredFormat: "hex",
			showInput: true,
			showInitial: true,
			showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
			palette: fpdInstance.mainOptions.colorPickerPalette,
			move: function(color) {

				currentLineColor = color.toHexString();
				if(instance.drawCanvas) {
					instance.drawCanvas.freeDrawingBrush.color = currentLineColor;
				}

			},
			change: function(color) {

				currentLineColor = color.toHexString();
				if(instance.drawCanvas) {
					instance.drawCanvas.freeDrawingBrush.color = currentLineColor;
				}

			}
		});

		$module.find('.fpd-slider-range').rangeslider({
			polyfill: false,
			rangeClass: 'fpd-range-slider',
			disabledClass: 'fpd-range-slider--disabled',
			horizontalClass: 'fpd-range-slider--horizontal',
		    verticalClass: 'fpd-range-slider--vertical',
		    fillClass: 'fpd-range-slider__fill',
		    handleClass: 'fpd-range-slider__handle',
		    onSlide: function(pos, value) {
			    this.$element.parent().siblings('.fpd-slider-number').val(value).change();
		    }
		});

		$module.find('.fpd-slider-number').change(function() {

			var $this = $(this);

			if( this.value > Number($this.attr('max')) ) {
				this.value = Number($this.attr('max'));
			}

			if( this.value < Number($this.attr('min')) ) {
				this.value = Number($this.attr('min'));
			}

			$this.next('.fpd-range-wrapper').children('input').val(this.value)
			.rangeslider('update', true, false);

			if($this.hasClass('fpd-drawing-line-width') && instance.drawCanvas) {
				instance.drawCanvas.freeDrawingBrush.width = this.value;
			}

		});

		$module.on('click', '.fpd-clear-drawing', function() {

			instance.drawCanvas.dispose();
			_createDrawCanvas();

		});

		$module.on('click', '.fpd-add-drawing', function() {

			var drawingProps = {
				autoCenter: true,
				draggable: true,
				resizable: true,
				removable: true,
				rotatable: true,
				autoSelect: true,
				colors: false,
				patterns: false,
				isCustom: true
			};

			var drawSVG = instance.drawCanvas.toSVG({suppressPreamble: true}).replace(/(?:\r\n|\r|\n)/g, '');

			fpdInstance.addElement(
				'image',
				drawSVG,
				new Date().getTime(),
				$.extend({}, fpdInstance.currentViewInstance.options.customImageParameters, drawingProps)
			);

			instance.drawCanvas.clear();

		});

		var _getFabricBrush = function(type) {

			if(type === 'hline') {
			    return _getCustomBrush(instance.drawCanvas, 'hLine');
		    }
		    else if(type === 'vline') {
		      	return _getCustomBrush(instance.drawCanvas, 'vLine');
		    }
		    else {
			    return new fabric[type + 'Brush'](instance.drawCanvas);
		    }

		};

		var _createDrawCanvas = function() {

			var drawCanvasWidth = $module.parents('.fpd-draggable-dialog:first').length > 0 ? $module.parents('.fpd-draggable-dialog:first').width() : $module.parent('.fpd-content').width();

			drawCanvasWidth = drawCanvasWidth ? drawCanvasWidth : 300;
			drawCanvasWidth -= (parseInt($module.css('paddingLeft')) * 2);

			instance.drawCanvas = new fabric.Canvas($module.find('.fpd-drawing-canvas').get(0), {
				containerClass: 'fpd-drawing-container',
				isDrawingMode: true,
				width: drawCanvasWidth,
				height: 150
		  	});

		  	instance.drawCanvas.freeDrawingBrush = _getFabricBrush(currentBrushType);
		  	instance.drawCanvas.freeDrawingBrush.color = currentLineColor;
		  	instance.drawCanvas.freeDrawingBrush.width = $module.find('input.fpd-drawing-line-width').val();

		}

		_createDrawCanvas();

	};

	_initialize();

};

var FPDNamesNumbersModule = {

	setup: function(fpdInstance, $module) {

		var $lastSelectedRow = null;

		$module.off().find('.fpd-list').empty();

		var _setPlaceholderText = function(number, name) {

			if(fpdInstance.currentViewInstance.numberPlaceholder && typeof number == 'string') {
				fpdInstance.currentViewInstance.setElementParameters({text: number}, fpdInstance.currentViewInstance.numberPlaceholder);
			}

			if(fpdInstance.currentViewInstance.textPlaceholder && typeof name == 'string') {

				//remove emojis
				if(fpdInstance.mainOptions.disableTextEmojis) {
					name = name.replace(FPDEmojisRegex, '');
					name = name.replace(String.fromCharCode(65039), ""); //fix: some emojis left a symbol with char code 65039
				}

				fpdInstance.currentViewInstance.setElementParameters({text: name}, fpdInstance.currentViewInstance.textPlaceholder);
			}

			fpdInstance.currentViewInstance.stage.renderAll();

		};

		var _addRow = function(number, name, selectVal) {

			number = typeof number === 'undefined' ? '' : number;
			name = typeof name === 'undefined' ? '' : name;

			var rowHtml = '<div class="fpd-row">';

			if(fpdInstance.currentViewInstance.numberPlaceholder) {

				var minMaxHtml = '';
				if(Array.isArray(fpdInstance.currentViewInstance.numberPlaceholder.numberPlaceholder)) {
					minMaxHtml = 'min="'+fpdInstance.currentViewInstance.numberPlaceholder.numberPlaceholder[0]+'" max="'+fpdInstance.currentViewInstance.numberPlaceholder.numberPlaceholder[1]+'" ';
				}

				rowHtml += '<div class="fpd-number-col"><input type="number" placeholder="'+fpdInstance.currentViewInstance.numberPlaceholder.originParams.text+'" class="fpd-number" value="'+number+'" '+minMaxHtml+' /></div>';
			}

			if(fpdInstance.currentViewInstance.textPlaceholder) {
				rowHtml += '<div class="fpd-name-col"><div><input type="text" placeholder="'+fpdInstance.currentViewInstance.textPlaceholder.originParams.text+'" value="'+name+'" /></div></div>';
			}

			if((fpdInstance.mainOptions.namesNumbersDropdown && fpdInstance.mainOptions.namesNumbersDropdown.length > 0) || selectVal) {

				var selectValArr = [selectVal],
					dropdownProps = fpdInstance.mainOptions.namesNumbersDropdown.length > 0 ? fpdInstance.mainOptions.namesNumbersDropdown : selectValArr,
					optionsHtml = '';

				for(var i=0; i<dropdownProps.length; ++i) {
					selected = selectVal === dropdownProps[i] ? 'selected="selected"' : '';
					optionsHtml += '<option value="'+dropdownProps[i]+'" '+selected+'>'+dropdownProps[i]+'</option>';
				}

				rowHtml += '<div class="fpd-select-col"><label><select>'+optionsHtml+'</select></label></div>';

			}

			rowHtml += '<div class="fpd-remove-col"><span><span class="fpd-icon-remove"></span></span></div></div></div>';

			$module.find('.fpd-list').append(rowHtml);

			FPDUtil.createScrollbar($module.find('.fpd-scroll-area'));

			return $module.find('.fpd-list .fpd-row:last');

		};

		if(fpdInstance.currentViewInstance.textPlaceholder || fpdInstance.currentViewInstance.numberPlaceholder) {

			$module.children('.fpd-names-numbers-panel').toggleClass('fpd-disabled', false);

			if(fpdInstance.currentViewInstance.names_numbers && Array.isArray(fpdInstance.currentViewInstance.names_numbers)) {

				for(var i=0; i<fpdInstance.currentViewInstance.names_numbers.length; ++i) {

					var nnRow = fpdInstance.currentViewInstance.names_numbers[i];
					_addRow(nnRow.number, nnRow.name, nnRow.select);

				}

			}
			else {
				_addRow();
			}

		}
		else {
			$module.children('.fpd-names-numbers-panel').toggleClass('fpd-disabled', true);
		}

		$module.on('click', '.fpd-remove-col', function() {

			var $thisRow = $(this).parents('.fpd-row:first');

			if($thisRow.siblings('.fpd-row').length > 0) {
				$thisRow.remove();

				//if the selected row is deleted, update placeholders to first inputs
				if($lastSelectedRow && $lastSelectedRow.get(0) === $thisRow.get(0)) {
					$module.find('.fpd-row:first input:first').mouseup();
				}

				fpdInstance.currentViewInstance.names_numbers = FPDNamesNumbersModule.getViewNamesNumbers($module);
				fpdInstance.currentViewInstance.changePrice(fpdInstance.currentViewInstance.options.namesNumbersEntryPrice, '-');
			}

		});

		$module.on('mouseup keyup', '.fpd-row input', function() {

			var $this = $(this);

			if($lastSelectedRow && $lastSelectedRow.get(0) !== $this.parents('.fpd-row:first').get(0)) { //set placeholders to new selected row inputs

				var $row = $this.parents('.fpd-row:first');
				_setPlaceholderText($row.find('.fpd-number').val(), $row.find('.fpd-name-col input').val())

			}
			else {

				var targetMaxLength = $this.hasClass('fpd-number') ? fpdInstance.currentViewInstance.numberPlaceholder.maxLength : fpdInstance.currentViewInstance.textPlaceholder.maxLength;

				if(targetMaxLength != 0 && this.value.length > targetMaxLength) {
					this.value = this.value.substr(0, targetMaxLength);
				}

				if($this.hasClass('fpd-number')) {

					//check if min/max limits are set and apply
					if($this.attr('min') !== undefined && this.value !== '') {

						if( this.value > Number($this.attr('max')) ) {
							this.value = Number($this.attr('max'));
						}

						if( this.value < Number($this.attr('min')) ) {
							this.value = Number($this.attr('min'));
						}

					}



					_setPlaceholderText(this.value);

				}
				else {
					_setPlaceholderText(false, this.value);
				}

			}

			$lastSelectedRow = $this.parents('.fpd-row:first');

		});

		$module.on('click', '.fpd-btn', function() {

			var $row = _addRow();
			$module.find('.fpd-list .fpd-row:last input:first').focus();

			_setPlaceholderText($row.find('.fpd-number').attr('placeholder'), $row.find('.fpd-name-col input').attr('placeholder'));

			fpdInstance.currentViewInstance.names_numbers = FPDNamesNumbersModule.getViewNamesNumbers($module);
			fpdInstance.currentViewInstance.changePrice(fpdInstance.currentViewInstance.options.namesNumbersEntryPrice, '+');

			$lastSelectedRow = $row;

		});

		$module.on('change', 'input, select', function() {

			fpdInstance.currentViewInstance.names_numbers = FPDNamesNumbersModule.getViewNamesNumbers($module);

		});

	},

	getViewNamesNumbers : function($module) {

		var nnArr = [];

		$module.find('.fpd-list .fpd-row').each(function(i, row) {

			var $row = $(row),
				rowObj = {};

			if($row.children('.fpd-number-col').length > 0) {
				rowObj.number = $row.find('.fpd-number').val();
			}

			if($row.children('.fpd-name-col').length > 0) {
				rowObj.name = $row.find('.fpd-name-col input').val();
			}

			if($row.children('.fpd-select-col').length > 0) {
				rowObj.select = $row.find('.fpd-select-col select').val();
			}

			nnArr.push(rowObj);

		});

		return nnArr;

	},

};

var FPDDynamicViews = function(fpdInstance, $module) {

	'use strict';

	$ = jQuery;

	var instance = this,
		selectCreatedView = null,
		unitFormat = fpdInstance.mainOptions.dynamicViewsOptions.unit,
		formats = fpdInstance.mainOptions.dynamicViewsOptions.formats,
		minWidth = fpdInstance.mainOptions.dynamicViewsOptions.minWidth,
		minHeight = fpdInstance.mainOptions.dynamicViewsOptions.minHeight,
		maxWidth = fpdInstance.mainOptions.dynamicViewsOptions.maxWidth,
		maxHeight = fpdInstance.mainOptions.dynamicViewsOptions.maxHeight,
		currentLayouts = [],
		startSortIndex = null;

	var _array_move = function(arr, fromIndex, toIndex) {

	    var element = arr[fromIndex];
		arr.splice(fromIndex, 1);
	    arr.splice(toIndex, 0, element);
	};

	var _checkDimensionLimits = function(type, input) {

		if(type == 'width') {

			if(input.value < minWidth) { input.value = minWidth; }
			else if(input.value > maxWidth) { input.value = maxWidth; }

		}
		else {

			if(input.value < minHeight) { input.value = minHeight; }
			else if(input.value > maxHeight) { input.value = maxHeight; }

		}

		return input.value;

	};

	var _initialize = function() {

		$module.find('.fpd-list').sortable({
			placeholder: 'fpd-item fpd-sortable-placeholder',
			items: '.fpd-item',
			cancel: 'input',
			handle: '.fpd-view-thumbnail',
			scroll: false,
			axis: 'y',
			start: function(evt, ui) {
				startSortIndex = ui.item.index();
			},
			update: function(evt, ui) {

				var newIndex = ui.item.index(),
					$views = fpdInstance.$productStage.children('.fpd-view-stage'),
					$viewThumbs = fpdInstance.$viewSelectionWrapper.find('.fpd-item');

				if(newIndex == 0) { //set a first position

					$views.eq(startSortIndex).insertBefore($views.eq(0));
					$viewThumbs.eq(startSortIndex).insertBefore($viewThumbs.eq(0));

				}
				else {

					if(startSortIndex > newIndex) {
						$views.eq(startSortIndex).insertBefore($views.eq(newIndex));
						$viewThumbs.eq(startSortIndex).insertBefore($viewThumbs.eq(newIndex));
					}
					else {
						$views.eq(startSortIndex).insertAfter($views.eq(newIndex));
						$viewThumbs.eq(startSortIndex).insertAfter($viewThumbs.eq(newIndex));
					}

				}

				_array_move(fpdInstance.viewInstances, startSortIndex, newIndex);

				if(startSortIndex == fpdInstance.currentViewIndex) {

					fpdInstance.selectView(newIndex);

				}

			}
		});

		fpdInstance.$container
		.on('productSelect', function() { //clear view list
			$module.find('.fpd-list').empty();
		})
		.on('productCreate', function() { //toggle layouts button

			if(fpdInstance.currentViewInstance.options.layouts && fpdInstance.currentViewInstance.options.layouts.length > 0) {

				$module.find('.fpd-add-from-layouts').removeClass('fpd-hidden');

			}
			else {
				$module.find('.fpd-add-from-layouts').addClass('fpd-hidden');
			}

		})
		.on('uiSet', function(evt, viewInstance) { //set up formats for blank module

			var $blankCon = fpdInstance.mainBar.$content.find('.fpd-dynamic-views-blank');

			if($.isArray(formats) && formats.length > 0) {

				var $blankFormatsDropdown = $blankCon.find('.fpd-blank-formats').removeClass('fpd-hidden');

				formats.forEach(function(format, index) {

					$('<span/>', {
						'class': 'fpd-item',
						'data-value': index,
						'html': format[0]+' x '+format[1]
					}).appendTo($blankFormatsDropdown.find('.fpd-dropdown-list'));

				});

			}

			$blankCon.find('.fpd-dynamic-views-unit').text(unitFormat); //set unit format in blank module

			fpdInstance.mainBar.$content
			.on('click', '.fpd-blank-formats .fpd-item', function() { //select format inside add blank view

				var selectedFormatIndex = $(this).data('value');

				fpdInstance.mainBar.$content.find('.fpd-blank-custom-size .fpd-width').val(formats[selectedFormatIndex][0])
				.nextAll('input:first').val(formats[selectedFormatIndex][1]);


			})
			.on('click', '.fpd-dynamic-views-blank .fpd-btn', function() { //add blank view

				var allValid = true,
					viewOptions = {};

				$blankCon.find('.fpd-blank-custom-size input').each(function() {

					var $this = $(this);

					if(this.value.length == 0) {

						allValid = false;
						$this.addClass('fpd-error');

					}
					else {

						viewOptions[$this.hasClass('fpd-width') ? 'stageWidth' : 'stageHeight'] = FPDUtil.unitToPixel(Number(this.value), unitFormat);

					}

				});

				if(allValid) {

					viewOptions.output = {width: FPDUtil.pixelToUnit(viewOptions.stageWidth, 'mm'), height: FPDUtil.pixelToUnit(viewOptions.stageHeight, 'mm')};

					selectCreatedView = fpdInstance.viewInstances.length;

					fpdInstance.addView({
						title: Date.now(),
						thumbnail: '',
						elements: [],
						options: viewOptions
					});

					$blankCon.find('.fpd-blank-custom-size input').val('').removeClass('fpd-error');

				}

			})
			.on('click', '.fpd-dynamic-views-layouts .fpd-item', function() { //add view from layout

				var $this = $(this),
					layoutIndex = $this.parent().children('.fpd-item').index($this);

				selectCreatedView = fpdInstance.viewInstances.length;

				fpdInstance.addView(currentLayouts[layoutIndex]);

			});

		})
		.on('viewCreate', function(evt, viewInstance) {

			if(selectCreatedView !== null) {

				fpdInstance.selectView(selectCreatedView);
				fpdInstance.mainBar.callModule('dynamic-views');
				selectCreatedView = null;

			}

			viewInstance.toDataURL(function(dataURL) {

				var viewWidthUnit = FPDUtil.pixelToUnit(viewInstance.options.stageWidth, unitFormat),
					viewHeightUnit = FPDUtil.pixelToUnit(viewInstance.options.stageHeight, unitFormat),
					$lastItem = $('<div/>', {
						'class': 'fpd-item',
						'html': '<div class="fpd-view-thumbnail"><picture style="background-image: url('+dataURL+')"></picture></div><div class="fpd-actions"><div class="fpd-copy-view"><span class="fpd-icon-copy"></span></div><div class="fpd-dimensions"><input type="number" class="fpd-width" value="'+viewWidthUnit+'" min="'+minWidth+'" max="'+maxWidth+'" />x<input type="number" value="'+viewHeightUnit+'" min="'+minHeight+'" max="'+maxHeight+'" />'+unitFormat+'</div><div class="fpd-remove-view"><span class="fpd-icon-remove"></span></div></div>'
					}).appendTo($module.find('.fpd-list'));

				FPDUtil.createScrollbar($module.find('.fpd-scroll-area'));

			})

		})
		.on('viewRemove', function(evt, viewIndex) {

			$module.find('.fpd-list .fpd-item').eq(viewIndex).remove();

		})
		.on('viewCanvasUpdate', function(evt, viewInstance) {

			if(fpdInstance.productCreated) { //update view thumbnail

				var viewIndex = fpdInstance.$productStage.children('.fpd-view-stage').index($(viewInstance.stage.wrapperEl)),
					multiplier = FPDUtil.getScalingByDimesions(viewInstance.options.stageWidth, viewInstance.options.stageHeight, 250, 200);

				viewInstance.toDataURL(function(dataURL) {

					$module.find('.fpd-item').eq(viewIndex).find('picture').css('background-image', 'url('+dataURL+')');

					if(viewInstance.thumbnail === '') {
						fpdInstance.$viewSelectionWrapper.find('.fpd-item').eq(viewIndex).find('picture').css('background-image', 'url('+dataURL+')');
					}

				}, 'transparent', {multiplier: multiplier}, false, false);

			}

		})
		.on('secondaryModuleCalled', function(evt, className, $moduleContainer) {

			if(className == 'fpd-dynamic-views-layouts') { //set up layouts from view options

				$moduleContainer.find('.fpd-scroll-area .fpd-grid').empty();

				var layouts = fpdInstance.viewInstances[0].options.layouts;
				if($.isArray(layouts)) {

					currentLayouts = layouts;

					layouts.forEach(function(layoutObject) {

						var $lastItem = $('<div/>', {
									'class': 'fpd-item fpd-tooltip',
									'title': layoutObject.title,
									'html': '<picture style="background-image: url('+layoutObject.thumbnail+'");"></picture>'
								}).appendTo($moduleContainer.find('.fpd-scroll-area .fpd-grid'));

					});

					FPDUtil.updateTooltip($moduleContainer.children('.fpd-scroll-area'));
					FPDUtil.createScrollbar($moduleContainer.children('.fpd-scroll-area'));

				}

			}

		})
		.on('clear', function() {

			$module.find('.fpd-list .fpd-item').remove();

		})
		.on('viewCreate viewSizeChange', function(evt, viewInstance) { //toggle layouts button

			if(fpdInstance.mainOptions.dynamicViewsOptions.pricePerArea) {

				var width = FPDUtil.pixelToUnit(viewInstance.options.stageWidth, 'cm'),
					height = FPDUtil.pixelToUnit(viewInstance.options.stageHeight, 'cm');

				//check if canvas output has dimensions
				if(FPDUtil.objectHasKeys(viewInstance.options.output, ['width', 'height'])) {
					width = viewInstance.options.output.width / 10;
					height = viewInstance.options.output.height / 10;

				}

				var cm2 = Math.ceil(width * height),
					cm2Price = cm2 * Number(fpdInstance.mainOptions.dynamicViewsOptions.pricePerArea);

				viewInstance.changePrice(0, '+', cm2Price);

			}

		})

		$module.on('click', '.fpd-btn', function() { //selelct secondary module

			if($(this).hasClass('fpd-add-blank-view')) {
				fpdInstance.mainBar.callSecondary('fpd-dynamic-views-blank');
			}
			else {
				fpdInstance.mainBar.callSecondary('fpd-dynamic-views-layouts');
			}

		})
		.on('click', '.fpd-list .fpd-item', function() { //select view from views list

			var viewIndex = $module.find('.fpd-item').index($(this));
			fpdInstance.selectView(viewIndex);

		})
		.on('change', '.fpd-dimensions input', function() { //change view dimensions

			var $this = $(this),
				stageWidth,
				stageHeight;

			if($this.hasClass('fpd-width')) {

				stageWidth = FPDUtil.unitToPixel(_checkDimensionLimits('width', this), unitFormat);
				stageHeight = FPDUtil.unitToPixel(_checkDimensionLimits('height', $this.siblings('input[type="number"]').get(0)), unitFormat);

			}
			else {

				stageHeight = FPDUtil.unitToPixel(_checkDimensionLimits('height', this), unitFormat);
				stageWidth = FPDUtil.unitToPixel(_checkDimensionLimits('width', $this.siblings('input[type="number"]').get(0)), unitFormat);

			}

			//calculate output dimensions in mm
			var outputWidth = FPDUtil.pixelToUnit(stageWidth, 'mm'),
				outputHeight = FPDUtil.pixelToUnit(stageHeight, 'mm');

			if(fpdInstance.currentViewInstance.options.output) {
				fpdInstance.currentViewInstance.options.output.width = outputWidth;
				fpdInstance.currentViewInstance.options.output.height = outputHeight;
			}
			else {
				fpdInstance.currentViewInstance.options.output = {width: outputWidth, height: outputHeight};
			}

			//calculate canvas dimensions, max. width and height can not exceed 1000px for proper performance
			var scaleToMax = FPDUtil.getScalingByDimesions(stageWidth, stageHeight, 1000, 1000);
			scaleToMax = scaleToMax > 1 ? 1 : scaleToMax;

			fpdInstance.currentViewInstance.options.stageWidth = Math.round(stageWidth * scaleToMax);
			fpdInstance.currentViewInstance.options.stageHeight = Math.round(stageHeight * scaleToMax);

			//re-render printing box
			var tempPbVisiblity = fpdInstance.currentViewInstance.options.printingBox ? fpdInstance.currentViewInstance.options.printingBox.visibility : false;

			fpdInstance.currentViewInstance.options.printingBox = {
				top: 0,
				left: 0,
				width: fpdInstance.currentViewInstance.options.stageWidth,
				height: fpdInstance.currentViewInstance.options.stageHeight,
				visibility: tempPbVisiblity
			};
			fpdInstance.currentViewInstance.renderPrintingBox();

			//set width otherwise not updated
			fpdInstance.$productStage.width(fpdInstance.currentViewInstance.options.stageWidth);
			fpdInstance.currentViewInstance.resetCanvasSize();

			/**
		     * Gets fired when the size of a view is changed via the Dynamic Views module.
		     *
		     * @event FancyProductDesigner#viewSizeChange
		     * @param {Event} event
		     * @param {String} currentViewInstance - The current view instance.
		     */
			fpdInstance.$container.trigger('viewSizeChange', [fpdInstance.currentViewInstance]);


		})
		.on('click', '.fpd-copy-view', function(evt) { //remove view

			evt.stopPropagation();

			var viewIndex = $module.find('.fpd-item').index($(this).parents('.fpd-item:first')),
				viewInstance = fpdInstance.viewInstances[viewIndex];

			var viewElements = viewInstance.stage.getObjects(),
				jsonViewElements = [];

			for(var j=0; j < viewElements.length; ++j) {
				var element = viewElements[j];

				if(element.title !== undefined && element.source !== undefined) {
					var jsonItem = {
						title: element.title,
						source: element.source,
						parameters: viewInstance.getElementJSON(element),
						type: FPDUtil.getType(element.type)
					};

					jsonViewElements.push(jsonItem);
				}
			}

			fpdInstance.addView({
				title: viewInstance.title,
				thumbnail: viewInstance.thumbnail,
				elements: jsonViewElements,
				options: viewInstance.options
			});


		})
		.on('click', '.fpd-remove-view', function(evt) { //remove view

			evt.stopPropagation();

			var viewIndex = $module.find('.fpd-item').index($(this).parents('.fpd-item:first'));
			fpdInstance.removeView(viewIndex);

		});

	};

	_initialize();

};

/*
* Fancy Product Designer Plus
* An Add-On for Fancy Product Designer.
* Copyright 2016, Rafael Dery
*
* Only for the sale at the envato marketplaces
*/

var FancyProductDesignerPlus = {

	version: '1.0.7',
	setup: function($elem, fpdInstance) {

		// @@include('../../envato/evilDomain.js')

		if(fpdInstance.mainOptions.colorSelectionPlacement && fpdInstance.mainOptions.colorSelectionPlacement !== '') {

			new FPDColorSelection(fpdInstance);

		}

		$elem.on('langJSONLoad', function() {

			if(fpdInstance.mainOptions.bulkVariationsPlacement && fpdInstance.mainOptions.bulkVariations) {

				var bulkVariations = new FPDBulkVariations(fpdInstance);
				fpdInstance.bulkVariations = bulkVariations;

			}

		});

		if(fpdInstance.mainOptions.mainBarModules.indexOf('names-numbers') != -1) {

			$elem.on('viewCreate', function(evt, viewInstance) {

				if(viewInstance.names_numbers && viewInstance.names_numbers.length > 1) {
					viewInstance.changePrice((viewInstance.names_numbers.length-1) * viewInstance.options.namesNumbersEntryPrice, '+');
				}

			});

		}

	}

};

FancyProductDesignerPlus.availableModules = [
	'names-numbers',
	'drawing',
	'dynamic-views'
];