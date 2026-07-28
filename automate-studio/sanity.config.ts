import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {codeInput} from '@sanity/code-input'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {ProductSelectorInput} from './components/ProductSelectorInput'

export default defineConfig({
  name: 'default',
  title: 'admin-panel',

  projectId: 'fv0uht0z',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), codeInput()],

  schema: {
    types: schemaTypes,
  },

  /**
   * form.components.input
   * ─────────────────────
   * Intercept the input rendering for the `productUuid` field on the
   * `courseDetails` document type and replace it with our custom
   * ProductSelectorInput — no schema modification required.
   *
   * The resolver receives `props` from Sanity's form layer:
   *   - props.schemaType.name  → the field's schema type ('string', 'image', …)
   *   - props.id               → the full field path, e.g. 'productUuid'
   *   - props.path             → the field path array
   *
   * We match on both the document type (via the path) and the field name so
   * the custom input only activates on exactly this one field.
   */
  form: {
    components: {
      input: (props) => {
        // props.id is the field name at the current level.
        // We only want to intercept the 'productUuid' string field.
        if (
          props.id === 'productUuid' &&
          props.schemaType.name === 'string'
        ) {
          return ProductSelectorInput(props as any)
        }
        // Fall through to default Sanity rendering for all other fields.
        return props.renderDefault(props)
      },
    },
  },
})
