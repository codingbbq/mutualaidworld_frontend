/*** IMPORTS ***/
// Module imports
import React, { Component } from "react"
import Cookies from "js-cookie"

// Page wrapper
import Page from "./Page"

// Page elements
import SessionSetting from "../components/SessionSetting"
import SessionCard from "../components/SessionCard"
import StarRating from "../components/StarRating"

// Inputs
import Image from "../components/inputs/Image"
import TextArea from "../components/inputs/TextArea"
import Submit from "../components/inputs/Submit"

// Local JS Utilities
import Database from "../resources/Database"
import { getBase64 } from "../resources/Util"

// Image
import stubImage from "../../img/stub-image.png"
/*** [end of imports] ***/

export default class Confirmation extends Component {
  state = {
    scenarioData: null,
    parentScenarioId: this.props.match.params.scenario_id || "1",
    scenarioId: null,
    role: this.props.match.params.role || "doer",
    verb: this.props.match.params.verb || "fix",
    noun: this.props.match.params.noun || "roof",
    currentUser: Cookies.get("userId") || "1"
  }

  componentDidMount = () => {
    Database.getScenarioWithChildren({ id: this.state.parentScenarioId })
      .then(result => {
        const { data } = result.body.data.relationships.children_scenario
        // console.info("Success getting scenario:", data)
        let idList = []

        for (let i in data) {
          idList.push(data[i].id)
        }

        this.setChildrenScenarioData(idList)
      })
      .catch(error => {
        // console.error("Error getting scenarios:", error)
        this.setState({
          scenarioData: null
        })
      })
  }

  setChildrenScenarioData = list => {
    for (let i = 0, l = list.length; i < l; i++) {
      Database.getScenarioWithVouches({ id: list[i] })
        .then(result => {
          const { data } = result.body
          const { noun, verb } = data.attributes

          // console.info("Success getting child scenario:", data)

          if (noun === this.state.noun && verb === this.state.verb) {
            this.setState({
              scenarioData: data,
              scenarioId: list[i]
            })
          }
        })
        .catch(error => {
          // console.error("Error getting child scenario:", error)
        })
    }
  }

  submitConfirmation = params => {
    const { scenarioId, parentScenarioId, currentUser, role } = this.state
    const imageString = getBase64(params.image)

    const json = {
      data: {
        type: "vouches",
        attributes: {
          image: imageString,
          description: params.description || ""
        },
        relationships: {
          scenario: {
            data: {
              type: "scenarios",
              id: scenarioId || parentScenarioId
            }
          },
          verifier: {
            data: {
              type: "users",
              id: currentUser
            }
          }
        }
      }
    }

    Database.createVouch(json)
      .then(result => {
        // const { data } = result.body
        // console.log("Vouch successfully created:", data)

        this.props.history.push(`/${parentScenarioId}/${role}/instructions`)
      })
      .catch(error => {
        // console.error("Error creating vouch:", error)
      })
  }

  render() {
    const { role } = this.state

    let buttonObj = {
      labelPhrase: "Send Confirmation",
      clas: "footer-btn feed-btn",
      onSubmit: this.submitConfirmation,
      onSubmitParams: {
        photo: "photo",
        description: "description"
        // star_rating: "star_rating"
      }
    }
    let textareaObj = {
      inputID: "description"
    }

    const footer = <Submit {...buttonObj} />

    return (
      <Page className={`flow-page ${role}-flow-page`} footer={footer}>
        <h2 className="confirmation-header">
          {role === "doer" ? "Help us vouch for your work" : "Vouch that the work is complete"}
        </h2>
        {role === "requester" && (
          <SessionSetting className="vouch-settings">
            <SessionCard className="vouch-card" cardTitle="Work to vouch">
              <figure className="vouch-wrap">
                <div className="vouch-image-wrap">
                  <img src={stubImage} alt="Work" className="vouch-image" />
                </div>
                <figcaption className="vouch-image-caption">
                  <div className="vouch-message">
                    We worked hard and I feel we did a good job. Good luck with the rest of the repairs.
                  </div>
                </figcaption>
              </figure>
            </SessionCard>
          </SessionSetting>
        )}

        <SessionSetting headerLabel="Add a photo">
          <Image />
        </SessionSetting>

        <SessionSetting headerLabel="Include a message">
          <SessionCard className="input-card message-card">
            <TextArea {...textareaObj} />
          </SessionCard>
        </SessionSetting>

        {role === "requester" && <StarRating />}
      </Page>
    )
  }
}
