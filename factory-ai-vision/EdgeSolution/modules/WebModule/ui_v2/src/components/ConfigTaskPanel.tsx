import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import * as R from 'ramda';
import {
  Panel,
  Stack,
  PrimaryButton,
  DefaultButton,
  Dropdown,
  Text,
  TextField,
  Toggle,
  PanelType,
  getTheme,
  Label,
  mergeStyleSets,
} from '@fluentui/react';
import { useSelector, useDispatch } from 'react-redux';
import Axios from 'axios';

import { cameraOptionsSelector, getCameras } from '../store/cameraSlice';
import { partOptionsSelector, getParts } from '../store/partSlice';
import { ProjectData, InferenceMode } from '../store/project/projectTypes';
import { getTrainingProject, trainingProjectOptionsSelector } from '../store/trainingProjectSlice';
import { getAppInsights } from '../TelemetryService';
import { thunkPostProject } from '../store/project/projectActions';
import { ExpandPanel } from './ExpandPanel';
import { State } from 'RootStateType';

const sendTrainInfoToAppInsight = async (selectedParts): Promise<void> => {
  const { data: images } = await Axios.get('/api/images/');

  const selectedPartIds = selectedParts.map((e) => e.id);
  const interestedImagesLength = images.filter((e) => selectedPartIds.includes(e.part)).length;
  const appInsight = getAppInsights();
  if (appInsight)
    appInsight.trackEvent({
      name: 'train',
      properties: {
        images: interestedImagesLength,
        parts: selectedParts.length,
        source: '',
      },
    });
};

const { palette } = getTheme();
const classNames = mergeStyleSets({
  textWrapper: {
    paddingBottom: '16px',
  },
});
const panelStyles = {
  root: {
    height: 'calc(100% - 48px)',
    top: '46px',
  },
  main: {
    backgroundColor: palette.neutralLighter,
  },
  footerInner: {
    backgroundColor: palette.neutralLighter,
  },
};

type ConfigTaskPanelProps = {
  isOpen: boolean;
  onDismiss: () => void;
  projectData: ProjectData;
  isDemo?: boolean;
  isEdit?: boolean;
};

export const ConfigTaskPanel: React.FC<ConfigTaskPanelProps> = ({
  isOpen,
  onDismiss,
  projectData: initialProjectData,
  isDemo = false,
  isEdit = false,
}) => {
  const [projectData, setProjectData] = useState(initialProjectData);
  useEffect(() => {
    setProjectData(initialProjectData);
  }, [initialProjectData]);
  const cameraOptions = useSelector(cameraOptionsSelector(true));
  const partOptions = useSelector(partOptionsSelector(projectData.trainingProject));
  const trainingProjectOptions = useSelector(trainingProjectOptionsSelector(true));
  const canSelectProjectRetrain = useSelector((state: State) =>
    state.trainingProject.nonDemo.includes(projectData.trainingProject),
  );
  const dispatch = useDispatch();
  const history = useHistory();

  function onChange<K extends keyof P, P = ProjectData>(key: K, value: P[K]) {
    if (key === 'trainingProject') setProjectData(R.assoc('parts', []));
    setProjectData(R.assoc(key, value));
  }

  useEffect(() => {
    dispatch(getParts());
    dispatch(getCameras(true));
    dispatch(getTrainingProject(true));
  }, [dispatch, isDemo]);

  const onStart = async () => {
    sendTrainInfoToAppInsight(projectData.parts);

    await dispatch(
      thunkPostProject({ ...projectData, ...(!isDemo && { inferenceMode: InferenceMode.PartDetection }) }),
    );

    onDismiss();
    history.push('/home/deployment');
  };

  const onRenderFooterContent = () => {
    return (
      <Stack tokens={{ childrenGap: 5 }} horizontal>
        <PrimaryButton text={isEdit ? 'Redeploy' : 'Deploy'} onClick={onStart} />
        <DefaultButton text="Cancel" onClick={onDismiss} />
      </Stack>
    );
  };

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      hasCloseButton
      headerText={isEdit ? 'Edit task' : 'Deploy task'}
      onRenderFooterContent={onRenderFooterContent}
      isFooterAtBottom={true}
      type={PanelType.smallFluid}
      styles={panelStyles}
    >
      <Stack tokens={{ childrenGap: 10 }} styles={{ root: { width: '300px' } }}>
        <TextField required value={projectData.name} onChange={(_, newValue) => onChange('name', newValue)} />
        <Dropdown
          label="Model"
          options={trainingProjectOptions}
          required
          selectedKey={projectData.trainingProject}
          onChange={(_, options) => {
            onChange('trainingProject', options.key as number);
          }}
        />
        <Dropdown
          label="Camera"
          multiSelect
          options={cameraOptions}
          required
          selectedKeys={projectData.cameras}
          onChange={(_, option) => {
            onChange(
              'cameras',
              option.selected
                ? [...projectData.cameras, option.key as number]
                : projectData.cameras.filter((key) => key !== option.key),
            );
          }}
        />
        <Dropdown
          label="Objects"
          multiSelect
          options={partOptions}
          required
          selectedKeys={projectData.parts}
          onChange={(_, option) => {
            if (option) {
              onChange(
                'parts',
                option.selected
                  ? [...projectData.parts, option.key as number]
                  : projectData.parts.filter((key) => key !== option.key),
              );
            }
          }}
        />
      </Stack>
      <ExpandPanel
        titleHidden="Advanced options"
        titleVisible="Fewer options"
        iconPosition="end"
        bottomBorder
      >
        <Stack horizontal tokens={{ childrenGap: 50 }} styles={{ root: { paddingTop: '30px' } }}>
          <Stack.Item>
            <div className={classNames.textWrapper}>
              <Label>Cloud messaging</Label>
              <Text>Send successful inferences to the cloud</Text>
            </div>
            <Toggle
              label="Enable cloud messages"
              checked={projectData.sendMessageToCloud}
              onChange={(_, checked) => {
                onChange('sendMessageToCloud', checked);
              }}
              inlineLabel
            />
            {projectData.sendMessageToCloud && (
              <>
                <TextField
                  label="Frames per minute"
                  type="number"
                  value={projectData.framesPerMin?.toString()}
                  onChange={(_, newValue) => {
                    onChange('framesPerMin', parseInt(newValue, 10));
                  }}
                  disabled={!projectData.sendMessageToCloud}
                  required
                />
                <TextField
                  label="Accuracy threshold"
                  type="number"
                  value={projectData.accuracyThreshold?.toString()}
                  onChange={(_, newValue) => {
                    onChange('accuracyThreshold', parseInt(newValue, 10));
                  }}
                  disabled={!projectData.sendMessageToCloud}
                  suffix="%"
                  required
                />
              </>
            )}
          </Stack.Item>
          {canSelectProjectRetrain && (
            <Stack.Item>
              <div className={classNames.textWrapper}>
                <Label>Retraining image</Label>
                <Text>Save images to tag and improve training model</Text>
              </div>
              <Toggle
                inlineLabel
                label="Enable capturing images"
                checked={projectData.needRetraining}
                onChange={(_, checked) => {
                  onChange('needRetraining', checked);
                }}
              />
              {projectData.needRetraining && (
                <>
                  <Stack horizontal tokens={{ childrenGap: 24 }}>
                    <TextField
                      label="Min"
                      type="number"
                      value={projectData.accuracyRangeMin?.toString()}
                      onChange={(_, newValue) => {
                        onChange('accuracyRangeMin', parseInt(newValue, 10));
                      }}
                      suffix="%"
                      disabled={!projectData.needRetraining}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      value={projectData.accuracyRangeMax?.toString()}
                      onChange={(_, newValue) => {
                        onChange('accuracyRangeMax', parseInt(newValue, 10));
                      }}
                      suffix="%"
                      disabled={!projectData.needRetraining}
                    />
                  </Stack>
                  <TextField
                    label="Minimum Images to store"
                    type="number"
                    value={projectData.maxImages?.toString()}
                    onChange={(_, newValue) => {
                      onChange('maxImages', parseInt(newValue, 10));
                    }}
                    disabled={!projectData.needRetraining}
                  />
                </>
              )}
            </Stack.Item>
          )}
          <Stack.Item>
            <div className={classNames.textWrapper}>
              <Label>Send video to cloud</Label>
            </div>
            <Toggle
              inlineLabel
              label="Enable sending video"
              checked={projectData.sendVideoToCloud}
              onChange={(_, checked) => {
                onChange('sendVideoToCloud', checked);
              }}
            />
          </Stack.Item>
        </Stack>
      </ExpandPanel>
    </Panel>
  );
};
