import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Command from '@ckeditor/ckeditor5-core/src/command';

export default class SimpleBoxEditing extends Plugin {
	static get requires() {
		return [
			Widget
		];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( 'insertSimpleBox', new InsertSimpleBoxCommand( this.editor ) );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'simpleBox', {
			// Behaves like a self-contained object (e.g. an image).
			isObject: true,

			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block'
		} );

		schema.register( 'simpleBoxTitle', {
			// Cannot be split or left by the caret.
			isLimit: true,

			allowIn: 'simpleBox',

			// Allow content which is allowed in blocks (i.e. text with attributes).
			allowContentOf: '$block'
		} );

		schema.register( 'simpleBoxDescription', {
			// Cannot be split or left by the caret.
			isLimit: true,

			allowIn: 'simpleBox',

			// Allow content which is allowed in the root (e.g. paragraphs).
			allowContentOf: '$root'
		} );

		schema.addChildCheck( ( context, childDefinition ) => {
			if ( context.endsWith( 'simpleBoxDescription' ) && childDefinition.name == 'simpleBox' ) {
				return false;
			}
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// <simpleBox> converters
		conversion.for( 'upcast' ).elementToElement( {
			model: 'simpleBox',
			view: {
				name: 'div',
				classes: 'simple-box'
			}
		} );
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'simpleBox',
			view: {
				name: 'div',
				classes: 'simple-box'
			}
		} );
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'simpleBox',
			view: ( modelElement, viewWriter ) => {
				const section = viewWriter.createContainerElement( 'div', { class: 'simple-box' } );

				return toWidget( section, viewWriter, { label: 'simple box widget' } );
			}
		} );

		// <simpleBoxDescription> converters
		conversion.for( 'upcast' ).elementToElement( {
			model: 'simpleBoxDescription',
			view: {
				name: 'div',
				classes: 'simple-box-description'
			}
		} );
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'simpleBoxDescription',
			view: {
				name: 'div',
				classes: 'simple-box-description'
			}
		} );
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'simpleBoxDescription',
			view: ( modelElement, viewWriter ) => {
				// Note: You use a more specialized createEditableElement() method here.
				const div = viewWriter.createEditableElement( 'div', { class: 'simple-box-description' } );

				return toWidgetEditable( div, viewWriter );
			}
		} );
	}
}

class InsertSimpleBoxCommand extends Command {
	execute() {
		this.editor.model.change( writer => {
			// Insert <simpleBox>*</simpleBox> at the current selection position
			// in a way that will result in creating a valid model structure.
			this.editor.model.insertContent( createSimpleBox( writer ) );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'simpleBox' );

		this.isEnabled = allowedIn !== null;
	}
}

function createSimpleBox( writer ) {
	const simpleBox = writer.createElement( 'simpleBox' );
	const simpleBoxDescription = writer.createElement( 'simpleBoxDescription' );

	writer.append( simpleBoxDescription, simpleBox );

	// There must be at least one paragraph for the description to be editable.
	// See https://github.com/ckeditor/ckeditor5/issues/1464.
	writer.appendElement( 'paragraph', simpleBoxDescription );

	return simpleBox;
}
