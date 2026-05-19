<?php

namespace Drupal\authoritymatch_core\Plugin\Field\FieldType;

use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\Core\TypedData\DataDefinition;

/**
 * Plugin implementation of the 'authority_score' field type.
 *
 * @FieldType(
 *   id = "authority_score",
 *   label = @Translation("Authority Score"),
 *   description = @Translation("Stores computed authority grading scores"),
 *   default_widget = "authority_score_widget",
 *   default_formatter = "authority_score_formatter"
 * )
 */
class AuthorityScoreItem extends FieldItemBase {

  /**
   * {@inheritdoc}
   */
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {
    $properties = [];

    $properties['overall'] = DataDefinition::create('integer')
      ->setLabel(t('Overall Score'))
      ->setRequired(FALSE);

    $properties['grade'] = DataDefinition::create('string')
      ->setLabel(t('Letter Grade'))
      ->setRequired(FALSE);

    $properties['safety_score'] = DataDefinition::create('integer')
      ->setLabel(t('Safety Score'))
      ->setRequired(FALSE);

    $properties['stability_score'] = DataDefinition::create('integer')
      ->setLabel(t('Stability Score'))
      ->setRequired(FALSE);

    $properties['scale_score'] = DataDefinition::create('integer')
      ->setLabel(t('Scale Score'))
      ->setRequired(FALSE);

    $properties['compliance_score'] = DataDefinition::create('integer')
      ->setLabel(t('Compliance Score'))
      ->setRequired(FALSE);

    $properties['geography_score'] = DataDefinition::create('integer')
      ->setLabel(t('Geography Score'))
      ->setRequired(FALSE);

    $properties['calculated_at'] = DataDefinition::create('timestamp')
      ->setLabel(t('Calculated At'))
      ->setRequired(FALSE);

    return $properties;
  }

  /**
   * {@inheritdoc}
   */
  public static function schema(FieldStorageDefinitionInterface $field_definition) {
    return [
      'columns' => [
        'overall' => [
          'type' => 'int',
          'size' => 'small',
          'unsigned' => TRUE,
        ],
        'grade' => [
          'type' => 'varchar',
          'length' => 2,
        ],
        'safety_score' => [
          'type' => 'int',
          'size' => 'small',
          'unsigned' => TRUE,
        ],
        'stability_score' => [
          'type' => 'int',
          'size' => 'small',
          'unsigned' => TRUE,
        ],
        'scale_score' => [
          'type' => 'int',
          'size' => 'small',
          'unsigned' => TRUE,
        ],
        'compliance_score' => [
          'type' => 'int',
          'size' => 'small',
          'unsigned' => TRUE,
        ],
        'geography_score' => [
          'type' => 'int',
          'size' => 'small',
          'unsigned' => TRUE,
        ],
        'calculated_at' => [
          'type' => 'int',
          'size' => 'big',
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isEmpty() {
    return empty($this->overall);
  }
}
